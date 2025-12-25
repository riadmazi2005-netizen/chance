<?php
// driver_dashboard.php - Récupération des données pour le dashboard du chauffeur
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

if (!isset($_GET['driver_id'])) {
    sendError('ID du chauffeur requis');
}

$driverId = $_GET['driver_id'];

try {
    // Récupérer les informations du bus du chauffeur
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.bus_id,
            b.matricule,
            b.capacity,
            b.status,
            b.route_id,
            b.supervisor_id
        FROM buses b
        WHERE b.driver_id = :driver_id
        LIMIT 1
    ");
    $stmt->execute(['driver_id' => $driverId]);
    $bus = $stmt->fetch();

    $response = [
        'bus' => $bus ?: null,
        'route' => null,
        'supervisor' => null,
        'students' => [],
        'accidents' => [],
        'notifications' => []
    ];

    if ($bus) {
        // Récupérer le trajet
        if ($bus['route_id']) {
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    route_id as routeId,
                    departure,
                    terminus,
                    departure_time_morning as departureTimeMorning,
                    arrival_time_morning as arrivalTimeMorning,
                    departure_time_evening as departureTimeEvening,
                    arrival_time_evening as arrivalTimeEvening
                FROM routes
                WHERE id = :route_id
            ");
            $stmt->execute(['route_id' => $bus['route_id']]);
            $response['route'] = $stmt->fetch();
        }

        // Récupérer le responsable bus
        if ($bus['supervisor_id']) {
            $stmt = $pdo->prepare("
                SELECT 
                    s.id,
                    u.first_name as firstName,
                    u.last_name as lastName,
                    u.phone,
                    u.email
                FROM supervisors s
                INNER JOIN users u ON s.user_id = u.id
                WHERE s.id = :supervisor_id
            ");
            $stmt->execute(['supervisor_id' => $bus['supervisor_id']]);
            $response['supervisor'] = $stmt->fetch();
        }

        // Récupérer les élèves approuvés du bus
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.first_name as firstName,
                s.last_name as lastName,
                s.class,
                s.age,
                s.gender,
                s.zone as quarter,
                s.bus_group as busGroup,
                s.absence_count as absenceCount,
                s.tutor_id as tutorId,
                ut.phone as tutorPhone
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.bus_id = :bus_id AND s.status = 'approved'
            ORDER BY s.last_name, s.first_name
        ");
        $stmt->execute(['bus_id' => $bus['id']]);
        $response['students'] = $stmt->fetchAll();
    }

    // Récupérer les accidents du chauffeur
    $stmt = $pdo->prepare("
        SELECT 
            id,
            bus_id as busId,
            date,
            report,
            severity,
            created_at as createdAt
        FROM accidents
        WHERE driver_id = :driver_id
        ORDER BY date DESC
    ");
    $stmt->execute(['driver_id' => $driverId]);
    $response['accidents'] = $stmt->fetchAll();

    // Récupérer les notifications du chauffeur
    $stmt = $pdo->prepare("
        SELECT 
            id,
            sender_id as senderId,
            sender_type as senderType,
            type,
            title,
            message,
            is_read as read,
            created_at as created_date
        FROM notifications
        WHERE recipient_id = :driver_id AND recipient_type = 'driver'
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute(['driver_id' => $driverId]);
    $response['notifications'] = $stmt->fetchAll();

    // Convertir les valeurs numériques
    if ($response['bus']) {
        $response['bus']['capacity'] = (int)$response['bus']['capacity'];
    }

    foreach ($response['students'] as &$student) {
        $student['age'] = (int)$student['age'];
        $student['absenceCount'] = (int)$student['absenceCount'];
    }

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des données', 500);
}
?>