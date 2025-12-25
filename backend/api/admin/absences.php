<?php
// ============================================
// 13. api/admin/absences.php
// ============================================
function getAbsences() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT a.*,
                  CONCAT(s.first_name, ' ', s.last_name) as student_name,
                  s.class as student_class,
                  s.gender as student_gender,
                  b.bus_id as bus_name
                  FROM attendance a
                  INNER JOIN students s ON a.student_id = s.id
                  INNER JOIN buses b ON a.bus_id = b.id
                  WHERE a.status = 'absent'
                  ORDER BY a.date DESC";
        $stmt = $db->query($query);
        $absences = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Absences récupérées", $absences);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function getAbsenceStats() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $stats = [];
        
        // Top 10 élèves les plus absents
        $query = "SELECT 
                  CONCAT(s.first_name, ' ', s.last_name) as name,
                  s.class,
                  COUNT(a.id) as absences
                  FROM students s
                  INNER JOIN attendance a ON s.id = a.student_id
                  WHERE a.status = 'absent'
                  GROUP BY s.id, s.first_name, s.last_name, s.class
                  ORDER BY absences DESC
                  LIMIT 10";
        $stmt = $db->query($query);
        $stats['most_absent'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Top 10 élèves les plus présents (moins d'absences)
        $query = "SELECT 
                  CONCAT(s.first_name, ' ', s.last_name) as name,
                  s.class,
                  COALESCE(s.absence_count, 0) as absences
                  FROM students s
                  WHERE s.status = 'approved'
                  ORDER BY absences ASC
                  LIMIT 10";
        $stmt = $db->query($query);
        $stats['most_present'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Total présences et absences
        $query = "SELECT 
                  SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absences,
                  SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_presences
                  FROM attendance";
        $stmt = $db->query($query);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats = array_merge($stats, $totals);
        
        sendResponse(200, "Statistiques des absences récupérées", $stats);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>