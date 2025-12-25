-- ============================================
-- BASE DE DONNÉES TRANSPORT SCOLAIRE
-- École Mohammed V - Version Production Mise à Jour
-- ============================================

DROP DATABASE IF EXISTS transport_scolaire;
CREATE DATABASE transport_scolaire CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transport_scolaire;

-- ============================================
-- TABLE USERS (Utilisateurs du système)
-- ============================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    user_type ENUM('admin', 'tutor', 'driver', 'supervisor') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cin VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended', 'fired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_type (user_type),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ADMINS
-- ============================================
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE TUTORS (Tuteurs)
-- ============================================
CREATE TABLE tutors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE DRIVERS (Chauffeurs)
-- ============================================
CREATE TABLE drivers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    age INT,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    accident_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_license (license_number),
    
    CONSTRAINT chk_age CHECK (age >= 21 AND age <= 70),
    CONSTRAINT chk_salary CHECK (salary >= 0),
    CONSTRAINT chk_accident_count CHECK (accident_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE SUPERVISORS (Responsables Bus)
-- ============================================
CREATE TABLE supervisors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    salary DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_supervisor_salary CHECK (salary >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ROUTES (Trajets)
-- ============================================
CREATE TABLE routes (
    id VARCHAR(36) PRIMARY KEY,
    route_id VARCHAR(50) UNIQUE NOT NULL,
    departure VARCHAR(255) NOT NULL DEFAULT 'École Mohammed V',
    terminus VARCHAR(255) NOT NULL,
    departure_time_morning TIME,
    arrival_time_morning TIME,
    departure_time_evening TIME,
    arrival_time_evening TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_route_id (route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE BUSES
-- ============================================
CREATE TABLE buses (
    id VARCHAR(36) PRIMARY KEY,
    bus_id VARCHAR(50) UNIQUE NOT NULL,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    driver_id VARCHAR(36) UNIQUE,
    supervisor_id VARCHAR(36) UNIQUE,
    route_id VARCHAR(36),
    status ENUM('en_service', 'hors_service') DEFAULT 'en_service',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (supervisor_id) REFERENCES supervisors(id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    
    INDEX idx_bus_id (bus_id),
    INDEX idx_status (status),
    INDEX idx_driver (driver_id),
    INDEX idx_supervisor (supervisor_id),
    
    CONSTRAINT chk_capacity CHECK (capacity > 0 AND capacity <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE STUDENTS (Élèves) - MISE À JOUR
-- ============================================
CREATE TABLE students (
    id VARCHAR(36) PRIMARY KEY,
    tutor_id VARCHAR(36) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class VARCHAR(20) NOT NULL,
    age INT NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    zone VARCHAR(100) NOT NULL,
    parent_relation VARCHAR(50) NOT NULL,
    transport_type ENUM('aller', 'retour', 'aller-retour') NOT NULL,
    subscription_type ENUM('mensuel', 'annuel') NOT NULL,
    bus_id VARCHAR(36),
    bus_group ENUM('A', 'B'),
    route_id VARCHAR(36),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    payment_status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    absence_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
    
    INDEX idx_tutor (tutor_id),
    INDEX idx_bus (bus_id),
    INDEX idx_status (status),
    INDEX idx_payment (payment_status),
    INDEX idx_class (class),
    INDEX idx_zone (zone),
    
    CONSTRAINT chk_age_student CHECK (age >= 4 AND age <= 25),
    CONSTRAINT chk_absence CHECK (absence_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE PAYMENTS (Paiements) - MISE À JOUR
-- ============================================
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    tutor_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    discount_percentage INT DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) NOT NULL,
    transport_type ENUM('aller', 'retour', 'aller-retour') NOT NULL,
    subscription_type ENUM('mensuel', 'annuel') NOT NULL,
    status ENUM('paid', 'pending') DEFAULT 'pending',
    verification_code VARCHAR(20),
    payment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON DELETE CASCADE,
    
    INDEX idx_student (student_id),
    INDEX idx_tutor (tutor_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    
    CONSTRAINT chk_amount CHECK (amount > 0),
    CONSTRAINT chk_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    CONSTRAINT chk_final_amount CHECK (final_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ATTENDANCE (Présences)
-- ============================================
CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    bus_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    period ENUM('morning', 'evening') NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    bus_group ENUM('A', 'B') NOT NULL,
    marked_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES supervisors(id) ON DELETE SET NULL,
    
    INDEX idx_student (student_id),
    INDEX idx_bus (bus_id),
    INDEX idx_date (date),
    INDEX idx_period (period),
    INDEX idx_status (status),
    
    UNIQUE KEY unique_attendance (student_id, bus_id, date, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE ACCIDENTS
-- ============================================
CREATE TABLE accidents (
    id VARCHAR(36) PRIMARY KEY,
    driver_id VARCHAR(36) NOT NULL,
    bus_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    report TEXT NOT NULL,
    severity ENUM('minor', 'moderate', 'severe') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    
    INDEX idx_driver (driver_id),
    INDEX idx_bus (bus_id),
    INDEX idx_date (date),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(36) NOT NULL,
    recipient_type ENUM('admin', 'tutor', 'driver', 'supervisor') NOT NULL,
    sender_id VARCHAR(36),
    sender_type ENUM('admin', 'tutor', 'driver', 'supervisor', 'system'),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_sender (sender_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE RAISE_REQUESTS (Demandes d'augmentation)
-- ============================================
CREATE TABLE raise_requests (
    id VARCHAR(36) PRIMARY KEY,
    requester_id VARCHAR(36) NOT NULL,
    requester_type ENUM('driver', 'supervisor') NOT NULL,
    current_salary DECIMAL(10, 2) NOT NULL,
    reasons TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_requester (requester_id, requester_type),
    INDEX idx_status (status),
    
    CONSTRAINT chk_current_salary CHECK (current_salary >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TABLE IF NOT EXISTS bus_expenses (
    id VARCHAR(36) PRIMARY KEY,
    bus_id VARCHAR(36) NOT NULL,
    driver_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    type ENUM('fuel', 'repair', 'tire_inflation', 'maintenance', 'other') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    
    INDEX idx_bus (bus_id),
    INDEX idx_driver (driver_id),
    INDEX idx_date (date),
    INDEX idx_type (type),
    
    CONSTRAINT chk_expense_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index composite pour améliorer les performances
CREATE INDEX idx_bus_date ON bus_expenses(bus_id, date DESC);
CREATE INDEX idx_driver_date ON bus_expenses(driver_id, date DESC);
DELIMITER //

-- Trigger: Mise à jour automatique du nombre d'accidents du chauffeur
CREATE TRIGGER update_driver_accident_count 
AFTER INSERT ON accidents
FOR EACH ROW
BEGIN
    DECLARE accident_cnt INT;
    DECLARE user_id_val VARCHAR(36);
    
    SELECT COUNT(*) INTO accident_cnt
    FROM accidents 
    WHERE driver_id = NEW.driver_id;
    
    UPDATE drivers 
    SET accident_count = accident_cnt
    WHERE id = NEW.driver_id;
    
    IF accident_cnt >= 3 THEN
        SELECT user_id INTO user_id_val FROM drivers WHERE id = NEW.driver_id;
        UPDATE users 
        SET status = 'fired'
        WHERE id = user_id_val;
    END IF;
END//

-- Trigger: Mise à jour automatique du nombre d'absences de l'élève
CREATE TRIGGER update_student_absence_count 
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    DECLARE absence_cnt INT;
    
    IF NEW.status = 'absent' THEN
        SELECT COUNT(*) INTO absence_cnt
        FROM attendance 
        WHERE student_id = NEW.student_id AND status = 'absent';
        
        UPDATE students 
        SET absence_count = absence_cnt
        WHERE id = NEW.student_id;
    END IF;
END//

DELIMITER ;

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Admin par défaut (mot de passe: admin123)
INSERT INTO users (id, user_type, email, phone, password, first_name, last_name, status) 
VALUES 
('admin-001', 'admin', 'admin@mohammed5.ma', '0600000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', 'Principal', 'active');

INSERT INTO admins (id, user_id, username, full_name) 
VALUES 
('admin-001', 'admin-001', 'admin', 'Administrateur Principal');

-- Trajets par défaut pour les 6 zones
INSERT INTO routes (id, route_id, departure, terminus, departure_time_morning, arrival_time_morning, departure_time_evening, arrival_time_evening) 
VALUES
('route-001', 'ROUTE-Z1', 'École Mohammed V', 'Zone 1', '07:00:00', '07:30:00', '16:30:00', '17:00:00'),
('route-002', 'ROUTE-Z2', 'École Mohammed V', 'Zone 2', '07:00:00', '07:30:00', '16:30:00', '17:00:00'),
('route-003', 'ROUTE-Z3', 'École Mohammed V', 'Zone 3', '07:00:00', '07:30:00', '16:30:00', '17:00:00'),
('route-004', 'ROUTE-Z4', 'École Mohammed V', 'Zone 4', '07:00:00', '07:30:00', '16:30:00', '17:00:00'),
('route-005', 'ROUTE-Z5', 'École Mohammed V', 'Zone 5', '07:00:00', '07:30:00', '16:30:00', '17:00:00'),
('route-006', 'ROUTE-Z6', 'École Mohammed V', 'Zone 6', '07:00:00', '07:30:00', '16:30:00', '17:00:00');

-- Tuteur de test (mot de passe: test123)
INSERT INTO users (id, user_type, email, phone, password, first_name, last_name, cin, status) 
VALUES 
('tutor-001', 'tutor', 'test@test.com', '0612345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ahmed', 'Alami', 'AB123456', 'active');

INSERT INTO tutors (id, user_id, address) 
VALUES 
('tutor-001', 'tutor-001', '123 Rue Hassan II, Rabat');

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue: Informations complètes des utilisateurs
CREATE VIEW v_users_complete AS
SELECT 
    u.*,
    CASE 
        WHEN u.user_type = 'admin' THEN a.full_name
        ELSE CONCAT(u.first_name, ' ', u.last_name)
    END as display_name
FROM users u
LEFT JOIN admins a ON u.id = a.user_id;

-- Vue: Bus avec informations complètes
CREATE VIEW v_buses_complete AS
SELECT 
    b.*,
    CONCAT(ud.first_name, ' ', ud.last_name) as driver_name,
    ud.phone as driver_phone,
    CONCAT(us.first_name, ' ', us.last_name) as supervisor_name,
    us.phone as supervisor_phone,
    r.route_id,
    r.terminus,
    (SELECT COUNT(*) FROM students WHERE bus_id = b.id AND status = 'approved') as student_count
FROM buses b
LEFT JOIN drivers d ON b.driver_id = d.id
LEFT JOIN users ud ON d.user_id = ud.id
LEFT JOIN supervisors s ON b.supervisor_id = s.id
LEFT JOIN users us ON s.user_id = us.id
LEFT JOIN routes r ON b.route_id = r.id;

-- Vue: Élèves avec informations complètes
CREATE VIEW v_students_complete AS
SELECT 
    s.*,
    CONCAT(ut.first_name, ' ', ut.last_name) as tutor_name,
    ut.phone as tutor_phone,
    ut.email as tutor_email,
    ut.cin as tutor_cin,
    b.bus_id,
    b.matricule as bus_matricule,
    r.route_id,
    r.terminus
FROM students s
INNER JOIN tutors t ON s.tutor_id = t.id
INNER JOIN users ut ON t.user_id = ut.id
LEFT JOIN buses b ON s.bus_id = b.id
LEFT JOIN routes r ON s.route_id = r.id;

-- ============================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- ============================================

CREATE INDEX idx_student_bus_status ON students(bus_id, status);
CREATE INDEX idx_student_tutor_status ON students(tutor_id, status);
CREATE INDEX idx_attendance_date_period ON attendance(date, period);
CREATE INDEX idx_payments_status_date ON payments(status, payment_date);