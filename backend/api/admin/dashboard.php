<?php
// backend/api/admin/dashboard.php

// 1. Inclusion des dépendances
include_once '../../includes/cors.php';
include_once '../../config/database.php';
include_once '../../includes/functions.php';

// 2. Activation immédiate du CORS (pour éviter l'erreur "Failed to fetch")
if (function_exists('setCorsHeaders')) {
    setCorsHeaders();
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
    header("Access-Control-Allow-Methods: GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// 3. Connexion à la base
$database = new Database();
$db = $database->getConnection();

try {
    $stats = [];
    
    // Total et statuts des élèves
    $query = "SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_students,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_students,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_students
    FROM students";
    $stmt = $db->query($query);
    $studentStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $studentStats ?: []);
    
    // Stats des bus
    $query = "SELECT COUNT(*) as total_buses FROM buses";
    $stmt = $db->query($query);
    $busStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $busStats ?: []);
    
    // Stats des paiements
    $query = "SELECT SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments FROM payments";
    $stmt = $db->query($query);
    $payStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats = array_merge($stats, $payStats ?: []);

    // 4. Envoi de la réponse structurée pour apiService.js
    echo json_encode([
        "success" => true,
        "message" => "Statistiques récupérées",
        "data" => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur: " . $e->getMessage()
    ]);
}
?>