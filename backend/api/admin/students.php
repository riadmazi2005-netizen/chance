<?php

// ============================================
// 7. api/admin/students.php
// ============================================
function getStudents() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT * FROM v_students_complete WHERE status = 'approved' ORDER BY created_at DESC";
        $stmt = $db->query($query);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Élèves récupérés", $students);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>