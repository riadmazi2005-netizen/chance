<?php
// ============================================
// 15. api/admin/stats.php
// ============================================
function getCompleteStats() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $stats = [];
        
        // Stats générales (réutilise la fonction getDashboardStats)
        $query = "SELECT 
            COUNT(*) as total_students,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_students,
            SUM(CASE WHEN gender = 'male' AND status = 'approved' THEN 1 ELSE 0 END) as male_students,
            SUM(CASE WHEN gender = 'female' AND status = 'approved' THEN 1 ELSE 0 END) as female_students
        FROM students";
        $stmt = $db->query($query);
        $stats = array_merge($stats, $stmt->fetch(PDO::FETCH_ASSOC));
        
        // Utilisation des bus
        $query = "SELECT 
            b.bus_id as name,
            COUNT(s.id) as students,
            b.capacity
        FROM buses b
        LEFT JOIN students s ON b.id = s.bus_id AND s.status = 'approved'
        GROUP BY b.id, b.bus_id, b.capacity
        ORDER BY students DESC";
        $stmt = $db->query($query);
        $stats['bus_usage'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Élèves par classe
        $query = "SELECT 
            class as name,
            COUNT(*) as count
        FROM students
        WHERE status = 'approved'
        GROUP BY class
        ORDER BY class";
        $stmt = $db->query($query);
        $stats['students_by_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Accidents par chauffeur
        $query = "SELECT 
            CONCAT(u.first_name, ' ', u.last_name) as name,
            COUNT(a.id) as accidents
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN accidents a ON d.id = a.driver_id
        GROUP BY d.id, u.first_name, u.last_name
        HAVING accidents > 0
        ORDER BY accidents DESC";
        $stmt = $db->query($query);
        $stats['driver_accidents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Élèves les plus absents
        $query = "SELECT 
            CONCAT(s.first_name, ' ', s.last_name) as name,
            s.absence_count as absences
        FROM students s
        WHERE s.status = 'approved' AND s.absence_count > 0
        ORDER BY s.absence_count DESC
        LIMIT 5";
        $stmt = $db->query($query);
        $stats['absent_students'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Revenus
        $query = "SELECT 
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue
        FROM payments";
        $stmt = $db->query($query);
        $stats = array_merge($stats, $stmt->fetch(PDO::FETCH_ASSOC));
        
        // Compteurs
        $query = "SELECT 
            (SELECT COUNT(*) FROM buses) as total_buses,
            (SELECT COUNT(*) FROM drivers) as total_drivers,
            (SELECT COUNT(*) FROM routes) as total_routes,
            (SELECT COUNT(*) FROM accidents) as total_accidents";
        $stmt = $db->query($query);
        $stats = array_merge($stats, $stmt->fetch(PDO::FETCH_ASSOC));
        
        sendResponse(200, "Statistiques complètes récupérées", $stats);
        
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>