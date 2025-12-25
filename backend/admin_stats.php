<?php
// admin_stats.php - Statistiques avancées et analytics
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

try {
    // 1. Revenus
    $stmt = $pdo->query("
        SELECT 
            SUM(CASE WHEN status = 'paid' THEN final_amount ELSE 0 END) as totalRevenue,
            SUM(CASE WHEN status = 'pending' THEN final_amount ELSE 0 END) as pendingRevenue,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paidCount,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingCount
        FROM payments
    ");
    $revenueStats = $stmt->fetch();

    // 2. Utilisation des bus
    $stmt = $pdo->query("
        SELECT 
            b.bus_id as name,
            b.capacity,
            COUNT(s.id) as students,
            ROUND((COUNT(s.id) / b.capacity) * 100, 2) as occupancyRate
        FROM buses b
        LEFT JOIN students s ON b.id = s.bus_id AND s.status = 'approved'
        GROUP BY b.id
        ORDER BY students DESC
    ");
    $busUsage = $stmt->fetchAll();

    foreach ($busUsage as &$bus) {
        $bus['capacity'] = (int)$bus['capacity'];
        $bus['students'] = (int)$bus['students'];
        $bus['occupancyRate'] = (float)$bus['occupancyRate'];
    }

    // 3. Répartition par classe
    $stmt = $pdo->query("
        SELECT 
            class as name,
            COUNT(*) as count
        FROM students
        WHERE status = 'approved'
        GROUP BY class
        ORDER BY class
    ");
    $byClass = $stmt->fetchAll();

    foreach ($byClass as &$class) {
        $class['count'] = (int)$class['count'];
    }

    // 4. Répartition par genre
    $stmt = $pdo->query("
        SELECT 
            COUNT(CASE WHEN gender = 'male' THEN 1 END) as male,
            COUNT(CASE WHEN gender = 'female' THEN 1 END) as female
        FROM students
        WHERE status = 'approved'
    ");
    $genderStats = $stmt->fetch();

    // 5. Répartition par quartier/zone
    $stmt = $pdo->query("
        SELECT 
            zone as name,
            COUNT(*) as count
        FROM students
        WHERE status = 'approved'
        GROUP BY zone
        ORDER BY count DESC
    ");
    $byZone = $stmt->fetchAll();

    foreach ($byZone as &$zone) {
        $zone['count'] = (int)$zone['count'];
    }

    // 6. Accidents par chauffeur
    $stmt = $pdo->query("
        SELECT 
            CONCAT(u.first_name, ' ', u.last_name) as name,
            COUNT(a.id) as accidents
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN accidents a ON d.id = a.driver_id
        GROUP BY d.id
        HAVING accidents > 0
        ORDER BY accidents DESC
    ");
    $driverAccidents = $stmt->fetchAll();

    foreach ($driverAccidents as &$driver) {
        $driver['accidents'] = (int)$driver['accidents'];
    }

    // 7. Élèves les plus absents (top 5)
    $stmt = $pdo->query("
        SELECT 
            CONCAT(first_name, ' ', last_name) as name,
            class,
            absence_count as absences
        FROM students
        WHERE status = 'approved' AND absence_count > 0
        ORDER BY absence_count DESC
        LIMIT 5
    ");
    $absentStudents = $stmt->fetchAll();

    foreach ($absentStudents as &$student) {
        $student['absences'] = (int)$student['absences'];
    }

    // 8. Bus le plus utilisé
    $stmt = $pdo->query("
        SELECT 
            b.bus_id as name,
            COUNT(s.id) as students
        FROM buses b
        LEFT JOIN students s ON b.id = s.bus_id AND s.status = 'approved'
        GROUP BY b.id
        ORDER BY students DESC
        LIMIT 1
    ");
    $mostUsedBus = $stmt->fetch();

    // 9. Totaux généraux
    $stmt = $pdo->query("
        SELECT 
            (SELECT COUNT(*) FROM students WHERE status = 'approved') as totalStudents,
            (SELECT COUNT(*) FROM buses) as totalBuses,
            (SELECT COUNT(*) FROM drivers) as totalDrivers,
            (SELECT COUNT(*) FROM routes) as totalRoutes,
            (SELECT COUNT(*) FROM accidents) as totalAccidents
    ");
    $totals = $stmt->fetch();

    // 10. Type de transport
    $stmt = $pdo->query("
        SELECT 
            transport_type as type,
            COUNT(*) as count
        FROM students
        WHERE status = 'approved'
        GROUP BY transport_type
    ");
    $byTransportType = $stmt->fetchAll();

    foreach ($byTransportType as &$type) {
        $type['count'] = (int)$type['count'];
    }

    $response = [
        'revenue' => [
            'total' => (float)$revenueStats['totalRevenue'],
            'pending' => (float)$revenueStats['pendingRevenue'],
            'paidCount' => (int)$revenueStats['paidCount'],
            'pendingCount' => (int)$revenueStats['pendingCount']
        ],
        'busUsage' => $busUsage,
        'mostUsedBus' => $mostUsedBus,
        'byClass' => $byClass,
        'gender' => [
            'male' => (int)$genderStats['male'],
            'female' => (int)$genderStats['female']
        ],
        'byZone' => $byZone,
        'driverAccidents' => $driverAccidents,
        'absentStudents' => $absentStudents,
        'byTransportType' => $byTransportType,
        'totals' => [
            'students' => (int)$totals['totalStudents'],
            'buses' => (int)$totals['totalBuses'],
            'drivers' => (int)$totals['totalDrivers'],
            'routes' => (int)$totals['totalRoutes'],
            'accidents' => (int)$totals['totalAccidents']
        ]
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la récupération des statistiques', 500);
}
?>