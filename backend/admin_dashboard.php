<?php
// admin_dashboard.php - Statistiques pour le dashboard admin
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

try {
    // Statistiques des élèves
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN gender = 'male' AND status = 'approved' THEN 1 ELSE 0 END) as male,
            SUM(CASE WHEN gender = 'female' AND status = 'approved' THEN 1 ELSE 0 END) as female
        FROM students
    ");
    $studentStats = $stmt->fetch();

    // Statistiques des bus
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'en_service' THEN 1 ELSE 0 END) as active
        FROM buses
    ");
    $busStats = $stmt->fetch();

    // Statistiques des chauffeurs
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) as active
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
    ");
    $driverStats = $stmt->fetch();

    // Statistiques des paiements
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'paid' THEN final_amount ELSE 0 END) as total_revenue,
            SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END) as pending_revenue
        FROM payments
    ");
    $paymentStats = $stmt->fetch();

    // Total des accidents
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM accidents");
    $accidentStats = $stmt->fetch();

    // Total des trajets
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM routes");
    $routeStats = $stmt->fetch();

    // Bus les plus utilisés (top 5)
    $stmt = $pdo->query("
        SELECT 
            b.bus_id as name,
            COUNT(s.id) as students
        FROM buses b
        LEFT JOIN students s ON b.id = s.bus_id AND s.status = 'approved'
        GROUP BY b.id, b.bus_id
        ORDER BY students DESC
        LIMIT 5
    ");
    $busUsage = $stmt->fetchAll();

    // Notifications récentes pour l'admin
    $stmt = $pdo->prepare("
        SELECT 
            id,
            sender_id as senderId,
            sender_type as senderType,
            type,
            title,
            message,
            is_read as `read`,
            created_at as created_date
        FROM notifications
        WHERE recipient_type = 'admin'
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $stmt->execute();
    $notifications = $stmt->fetchAll();

    // Convertir les valeurs
    foreach ($notifications as &$notif) {
        $notif['read'] = (bool)$notif['read'];
    }

    $response = [
        'students' => [
            'total' => (int)$studentStats['total'],
            'approved' => (int)$studentStats['approved'],
            'pending' => (int)$studentStats['pending'],
            'male' => (int)$studentStats['male'],
            'female' => (int)$studentStats['female']
        ],
        'buses' => [
            'total' => (int)$busStats['total'],
            'active' => (int)$busStats['active']
        ],
        'drivers' => [
            'total' => (int)$driverStats['total'],
            'active' => (int)$driverStats['active']
        ],
        'payments' => [
            'total' => (int)$paymentStats['total'],
            'paid' => (int)$paymentStats['paid'],
            'pending' => (int)$paymentStats['pending'],
            'totalRevenue' => (float)$paymentStats['total_revenue'],
            'pendingRevenue' => (float)$paymentStats['pending_revenue']
        ],
        'accidents' => [
            'total' => (int)$accidentStats['total']
        ],
        'routes' => [
            'total' => (int)$routeStats['total']
        ],
        'busUsage' => $busUsage,
        'notifications' => $notifications
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des statistiques', 500);
}
?>