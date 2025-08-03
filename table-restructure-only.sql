-- ==================================================================
-- TABLE RESTRUCTURE FOR MULTI-SURAH SESSIONS
-- ==================================================================
-- 
-- This script restructures ONLY the tables for:
-- ✅ Normalized multi-surah session support
-- ✅ Proper RLS policies
-- ✅ Data integrity constraints
-- ✅ Performance indexes
--
-- KEEPS: All existing enums (no enum changes)
-- WARNING: This will DELETE ALL existing session data!
-- ==================================================================

-- ===========================
-- 1. DROP EXISTING TABLES ONLY
-- ===========================

-- Drop existing tables and views (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS mistakes CASCADE;
DROP TABLE IF EXISTS session_portions CASCADE; 
DROP TABLE IF EXISTS sessions CASCADE;
DROP VIEW IF EXISTS sessions_with_mistake_count CASCADE;
DROP VIEW IF EXISTS sessions_with_stats CASCADE;

-- NOTE: KEEPING ALL EXISTING ENUMS - NO CHANGES TO ENUMS

-- ===========================
-- 2. CREATE NEW TABLE STRUCTURE
-- ===========================

-- Sessions table (session-level info)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_type session_type_enum NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    performance_score DECIMAL(3,1) NOT NULL CHECK (performance_score >= 0 AND performance_score <= 10),
    session_goal TEXT,
    additional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session portions table (per-surah info)
CREATE TABLE session_portions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    surah_name surah_name_enum NOT NULL,
    ayah_start INTEGER NOT NULL CHECK (ayah_start > 0),
    ayah_end INTEGER NOT NULL CHECK (ayah_end > 0),
    juz_number INTEGER NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
    pages_read INTEGER NOT NULL CHECK (pages_read > 0),
    repetition_count INTEGER NOT NULL DEFAULT 1 CHECK (repetition_count > 0),
    recency_category recency_category_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure ayah_end >= ayah_start
    CONSTRAINT valid_ayah_range CHECK (ayah_end >= ayah_start)
);

-- Mistakes table (linked to specific portions)
CREATE TABLE mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    session_portion_id UUID NOT NULL REFERENCES session_portions(id) ON DELETE CASCADE,
    error_category error_category_enum NOT NULL,
    error_subcategory error_subcategory_enum,
    severity_level INTEGER NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    ayah_number INTEGER NOT NULL CHECK (ayah_number > 0),
    additional_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ===========================

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_type ON sessions(session_type);

-- Session portions indexes
CREATE INDEX idx_session_portions_session_id ON session_portions(session_id);
CREATE INDEX idx_session_portions_surah ON session_portions(surah_name);
CREATE INDEX idx_session_portions_recency ON session_portions(recency_category);

-- Mistakes indexes
CREATE INDEX idx_mistakes_session_id ON mistakes(session_id);
CREATE INDEX idx_mistakes_portion_id ON mistakes(session_portion_id);
CREATE INDEX idx_mistakes_category ON mistakes(error_category);
CREATE INDEX idx_mistakes_severity ON mistakes(severity_level);

-- ===========================
-- 4. CREATE USEFUL VIEW
-- ===========================

-- Session stats view
CREATE VIEW sessions_with_stats AS
SELECT 
    s.*,
    COUNT(sp.id) as portion_count,
    COUNT(m.id) as mistake_count,
    AVG(m.severity_level) as avg_mistake_severity,
    STRING_AGG(DISTINCT sp.surah_name::text, ', ') as surahs_practiced
FROM sessions s
LEFT JOIN session_portions sp ON s.id = sp.session_id
LEFT JOIN mistakes m ON s.id = m.session_id
GROUP BY s.id;

-- ===========================
-- 5. ENABLE ROW LEVEL SECURITY
-- ===========================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_portions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mistakes ENABLE ROW LEVEL SECURITY;

-- Sessions RLS Policy - users see only their own sessions
CREATE POLICY "sessions_policy" ON sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Session portions RLS Policy - inherits from session ownership
CREATE POLICY "session_portions_policy" ON session_portions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_portions.session_id 
            AND sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = session_portions.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- Mistakes RLS Policy - inherits from session ownership
CREATE POLICY "mistakes_policy" ON mistakes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = mistakes.session_id 
            AND sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id = mistakes.session_id 
            AND sessions.user_id = auth.uid()
        )
    );

-- ===========================
-- 6. CREATE TRIGGERS
-- ===========================

-- Auto-update updated_at for sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- 7. AYAH VALIDATION FUNCTION
-- ===========================

-- Function to validate ayah number is within portion range
CREATE OR REPLACE FUNCTION validate_mistake_ayah()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if ayah_number is within the session_portion's ayah range
    IF NOT EXISTS (
        SELECT 1 FROM session_portions sp
        WHERE sp.id = NEW.session_portion_id
        AND NEW.ayah_number BETWEEN sp.ayah_start AND sp.ayah_end
    ) THEN
        RAISE EXCEPTION 'Ayah number % is not within the portion range', NEW.ayah_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate mistake ayah numbers
CREATE TRIGGER validate_mistake_ayah_trigger
    BEFORE INSERT OR UPDATE ON mistakes
    FOR EACH ROW
    EXECUTE FUNCTION validate_mistake_ayah();

-- ===========================
-- TABLE RESTRUCTURE COMPLETE! ✅
-- ===========================

-- Verify the new structure
SELECT 'Table restructure completed successfully!' as status;

-- Show new table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('sessions', 'session_portions', 'mistakes')
ORDER BY table_name, ordinal_position;