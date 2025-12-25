<?php
// tutor_dashboard.php - Données pour le dashboard du tuteur
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

if (!isset($_GET['tutor_id'])) {
    sendError('ID du tuteur requis');
}

$tutorId = $_GET['tutor_id'];

try {
    // Récupérer tous les enfants du tuteur avec leurs détails
    $stmt = $pdo->prepare("
        SELECT 
            s.id,
            s.first_name as firstName,
            s.last_name as lastName,
            s.class,
            s.age,
            s.gender,
            s.zone as quarter,
            s.parent_relation as parentRelation,
            s.transport_type as transportType,
            s.subscription_type as subscriptionType,
            s.bus_group as busGroup,
            s.absence_count as absenceCount,
            s.payment_status as paymentStatus,
            s.status,
            s.created_at as createdAt,
            b.bus_id as busName,
            b.matricule as busMatricule,
            r.terminus as routeName,
            r.departure_time_morning as departureTimeMorning,
            r.arrival_time_morning as arrivalTimeMorning,
            r.departure_time_evening as departureTimeEvening,
            r.arrival_time_evening as arrivalTimeEvening
        FROM students s
        LEFT JOIN buses b ON s.bus_id = b.id
        LEFT JOIN routes r ON s.route_id = r.id
        WHERE s.tutor_id = :tutor_id
        ORDER BY s.status ASC, s.created_at DESC
    ");
    
    $stmt->execute(['tutor_id' => $tutorId]);
    $students = $stmt->fetchAll();

    // Convertir les valeurs
    foreach ($students as &$student) {
        $student['age'] = (int)$student['age'];
        $student['absenceCount'] = (int)$student['absenceCount'];
    }

    // Récupérer les paiements
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.student_id as studentId,
            p.amount,
            p.discount_percentage as discountPercentage,
            p.discount_amount as discountAmount,
            p.final_amount as finalAmount,
            p.transport_type as transportType,
            p.subscription_type as subscriptionType,
            p.status,
            p.payment_date as paymentDate,
            p.created_at as createdAt,
            s.first_name as studentFirstName,
            s.last_name as studentLastName
        FROM payments p
        INNER JOIN students s ON p.student_id = s.id
        WHERE p.tutor_id = :tutor_id
        ORDER BY p.created_at DESC
        LIMIT 10
    ");
    $stmt->execute(['tutor_id' => $tutorId]);
    $payments = $stmt->fetchAll();

    foreach ($payments as &$payment) {
        $payment['amount'] = (float)$payment['amount'];
        $payment['discountPercentage'] = (int)$payment['discountPercentage'];
        $payment['discountAmount'] = (float)$payment['discountAmount'];
        $payment['finalAmount'] = (float)$payment['finalAmount'];
        $payment['studentName'] = $payment['studentFirstName'] . ' ' . $payment['studentLastName'];
        unset($payment['studentFirstName'], $payment['studentLastName']);
    }

    // Récupérer les notifications récentes
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
        WHERE recipient_id = :tutor_id AND recipient_type = 'tutor'
        ORDER BY created_at DESC
        LIMIT 10
    ");
    $stmt->execute(['tutor_id' => $tutorId]);
    $notifications = $stmt->fetchAll();

    foreach ($notifications as &$notif) {
        $notif['read'] = (bool)$notif['read'];
    }

    // Statistiques
    $stats = [
        'totalStudents' => count($students),
        'pendingRegistrations' => count(array_filter($students, fn($s) => $s['status'] === 'pending')),
        'approvedStudents' => count(array_filter($students, fn($s) => $s['status'] === 'approved')),
        'pendingPayments' => count(array_filter($payments, fn($p) => $p['status'] === 'pending')),
        'totalPaid' => array_sum(array_map(fn($p) => $p['status'] === 'paid' ? $p['finalAmount'] : 0, $payments)),
        'unreadNotifications' => count(array_filter($notifications, fn($n) => !$n['read']))
    ];

    $response = [
        'students' => $students,
        'payments' => $payments,
        'notifications' => $notifications,
        'stats' => $stats
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des données', 500);
}
?>