-- Script to populate the database with initial test data

-- Users
INSERT INTO users (id, username, email, full_name, hashed_password, role, points, is_active, profile_image, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin', 'admin@fixzone.com', 'مدير النظام', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin', 0, true, NULL, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'technician1', 'tech1@fixzone.com', 'أحمد محمد', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'technician', 150, true, NULL, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'technician2', 'tech2@fixzone.com', 'محمود علي', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'technician', 120, true, NULL, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'manager', 'manager@fixzone.com', 'إبراهيم خالد', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'manager', 0, true, NULL, NOW(), NOW());

-- Note: The password for all test users is 'password'

-- Cases
INSERT INTO cases (id, device_model, serial_number, client_name, client_phone, issue_description, diagnosis, solution, status, technician_id, created_at, updated_at)
VALUES 
  ('55555555-5555-5555-5555-555555555555', 'iPhone 12', 'SN12345678', 'عمر أحمد', '01012345678', 'الشاشة لا تعمل بشكل صحيح', 'كابل الشاشة مفصول', 'تم إعادة توصيل كابل الشاشة', 'تم الإصلاح', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
  
  ('66666666-6666-6666-6666-666666666666', 'Samsung Galaxy S21', 'SN87654321', 'سارة محمد', '01098765432', 'البطارية لا تشحن', 'منفذ الشحن تالف', NULL, 'قيد الإصلاح', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW()),
  
  ('77777777-7777-7777-7777-777777777777', 'MacBook Pro', 'MAC123456', 'خالد إبراهيم', '01023456789', 'الجهاز لا يعمل', 'مشكلة في اللوحة الأم', NULL, 'بانتظار القطعة', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');

-- Notes
INSERT INTO notes (id, case_id, note_text, voice_note_url, created_by, created_at, updated_at)
VALUES 
  ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'تم فحص الجهاز ووجدت أن كابل الشاشة مفصول', NULL, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  
  ('99999999-9999-9999-9999-999999999999', '55555555-5555-5555-5555-555555555555', 'تم إصلاح المشكلة وإعادة توصيل الكابل', NULL, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 'منفذ الشحن تالف ويحتاج إلى استبدال', NULL, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', 'هناك مشكلة في اللوحة الأم، نحتاج إلى طلب قطعة بديلة', NULL, '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Activities
INSERT INTO activities (id, case_id, action, performed_by, created_at, updated_at)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'تم استلام الجهاز', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', 'تم فحص الجهاز', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '55555555-5555-5555-5555-555555555555', 'تم إصلاح الجهاز', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'تم استلام الجهاز', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '77777777-7777-7777-7777-777777777777', 'تم استلام الجهاز', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '77777777-7777-7777-7777-777777777777', 'تم طلب قطعة بديلة', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Work Logs
INSERT INTO work_logs (id, technician_id, case_id, start_time, end_time, total_duration, created_at, updated_at)
VALUES 
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '2 hours', 7200, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', 3600, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', 10800, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('llllllll-llll-llll-llll-llllllllllll', '33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', 7200, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Notifications
INSERT INTO notifications (id, recipient_id, message, is_read, related_case_id, created_at, updated_at)
VALUES 
  ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '22222222-2222-2222-2222-222222222222', 'تم طلب قطعة غيار للحالة الخاصة بك', false, '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
  
  ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '22222222-2222-2222-2222-222222222222', 'العميل سارة محمد يسأل عن حالة الجهاز', false, '66666666-6666-6666-6666-666666666666', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  
  ('oooooooo-oooo-oooo-oooo-oooooooooooo', '33333333-3333-3333-3333-333333333333', 'وصلت القطعة المطلوبة للحالة الخاصة بك', false, '77777777-7777-7777-7777-777777777777', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

-- Comment to execute this initial data file:
-- On Windows: psql -U postgres -d fz_maintenance_archive -f initial_data.sql
-- On Linux/Mac: psql -U postgres -d fz_maintenance_archive -f initial_data.sql
