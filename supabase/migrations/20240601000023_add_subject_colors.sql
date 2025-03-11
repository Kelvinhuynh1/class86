-- Add color column to timetable_slots if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'timetable_slots' AND column_name = 'color') THEN
        ALTER TABLE timetable_slots ADD COLUMN color TEXT;
    END IF;

    -- Update colors for existing subjects
    UPDATE timetable_slots SET color = 'bg-blue-100 border-blue-200' WHERE subject = 'Toán' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-blue-100 border-blue-200' WHERE subject = 'CĐBS Toán' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-green-100 border-green-200' WHERE subject = 'Khoa học' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-green-100 border-green-200' WHERE subject = 'CDBS KHTN' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-yellow-100 border-yellow-200' WHERE subject = 'Tiếng Anh' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-yellow-100 border-yellow-200' WHERE subject = 'Ngữ văn' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-purple-100 border-purple-200' WHERE subject = 'Lịch sử' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-indigo-100 border-indigo-200' WHERE subject = 'Địa lý' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-purple-100 border-purple-200' WHERE subject = 'Lịch sử/Địa lý' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-pink-100 border-pink-200' WHERE subject = 'Mĩ thuật' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-orange-100 border-orange-200' WHERE subject = 'Thể dục' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-red-100 border-red-200' WHERE subject = 'Tiếng Pháp' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-cyan-100 border-cyan-200' WHERE subject = 'Khoa học máy tính' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-cyan-100 border-cyan-200' WHERE subject = 'Công nghệ' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-fuchsia-100 border-fuchsia-200' WHERE subject = 'Âm nhạc' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-violet-100 border-violet-200' WHERE subject = 'Viễn cảnh toàn cầu' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-violet-100 border-violet-200' WHERE subject = 'GDCD' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-amber-100 border-amber-200' WHERE subject = 'GDĐP' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-emerald-100 border-emerald-200' WHERE subject = 'HĐTNHN' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-rose-100 border-rose-200' WHERE subject = 'Well-being' AND color IS NULL;
    UPDATE timetable_slots SET color = 'bg-slate-100 border-slate-200' WHERE subject = 'SHCN' AND color IS NULL;
    
    -- Set default color for any remaining subjects without colors
    UPDATE timetable_slots SET color = 'bg-gray-100 border-gray-200' WHERE color IS NULL;
    
 END;
$$;
