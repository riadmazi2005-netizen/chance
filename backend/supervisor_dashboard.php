<?php
// supervisor_dashboard.php - Données pour le dashboard du superviseur
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

if (!isset($_GET['supervisor_id'])) {
    sendError('ID du superviseur requis');
}

$supervisorId = $_GET['supervisor_id'];

try {
    // Récupérer le bus du superviseur
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.bus_id,
            b.matricule,
            b.capacity,
            b.status,
            b.route_id,
            b.driver_id
        FROM buses b
        WHERE b.supervisor_id = :supervisor_id
        LIMIT 1
    ");
    $stmt->execute(['supervisor_id' => $supervisorId]);
    $bus = $stmt->fetch();

    $response = [
        'bus' => $bus ?: null,
        'driver' => null,
        'route' => null,
        'students' => [],
        'accidents' => [],
        'notifications' => []
    ];

    if ($bus) {
        // Récupérer le chauffeur
        if ($bus['driver_id']) {
            $stmt = $pdo->prepare("
                SELECT 
                    d.id,
                    u.first_name as firstName,
                    u.last_name as lastName,
                    u.phone,
                    u.email,
                    d.license_number as licenseNumber,
                    d.age,
                    d.salary,
                    d.accident_count as accidentCount
                FROM drivers d
                INNER JOIN users u ON d.user_id = u.id
                WHERE d.id = :driver_id
            ");
            $stmt->execute(['driver_id' => $bus['driver_id']]);
            $driver = $stmt->fetch();
            if ($driver) {
                $driver['age'] = (int)$driver['age'];
                $driver['salary'] = (float)$driver['salary'];
                $driver['accidentCount'] = (int)$driver['accidentCount'];
                $response['driver'] = $driver;
            }
        }

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

        // Récupérer les élèves approuvés du bus avec infos tuteurs
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.first_name as firstName,
                s.last_name as lastName,
                s.class,
                s.age,
                s.gender,
                s.zone as quarter,
                s.transport_type as transportType,
                s.subscription_type as subscriptionType,
                s.bus_group as busGroup,
                s.absence_count as absenceCount,
                s.payment_status as paymentStatus,
                s.tutor_id as tutorId,
                ut.phone as tutorPhone,
                CONCAT(ut.first_name, ' ', ut.last_name) as tutorName
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.bus_id = :bus_id AND s.status = 'approved'
            ORDER BY s.last_name, s.first_name
        ");
        $stmt->execute(['bus_id' => $bus['id']]);
        $students = $stmt->fetchAll();

        // Convertir les valeurs numériques
        foreach ($students as &$student) {
            $student['age'] = (int)$student['age'];
            $student['absenceCount'] = (int)$student['absenceCount'];
        }
        $response['students'] = $students;

        // Récupérer les accidents du chauffeur
        if ($bus['driver_id']) {
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
            $stmt->execute(['driver_id' => $bus['driver_id']]);
            $response['accidents'] = $stmt->fetchAll();
        }
    }

    // Récupérer les notifications du superviseur
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
        WHERE recipient_id = :supervisor_id AND recipient_type = 'supervisor'
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute(['supervisor_id' => $supervisorId]);
    $response['notifications'] = $stmt->fetchAll();

    // Convertir les valeurs
    if ($response['bus']) {
        $response['bus']['capacity'] = (int)$response['bus']['capacity'];
    }

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des données', 500);
}
?>