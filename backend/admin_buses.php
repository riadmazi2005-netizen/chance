<?php
// admin_buses.php - Gestion CRUD des bus
require_once 'config.php';

// GET - Récupérer tous les bus
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                b.id,
                b.bus_id as busId,
                b.matricule,
                b.capacity,
                b.driver_id as driverId,
                b.supervisor_id as supervisorId,
                b.route_id as routeId,
                b.status,
                CONCAT(ud.first_name, ' ', ud.last_name) as driverName,
                CONCAT(us.first_name, ' ', us.last_name) as supervisorName,
                r.terminus as routeName
            FROM buses b
            LEFT JOIN drivers d ON b.driver_id = d.id
            LEFT JOIN users ud ON d.user_id = ud.id
            LEFT JOIN supervisors s ON b.supervisor_id = s.id
            LEFT JOIN users us ON s.user_id = us.id
            LEFT JOIN routes r ON b.route_id = r.id
            ORDER BY b.bus_id
        ");
        
        $buses = $stmt->fetchAll();

        foreach ($buses as &$bus) {
            $bus['capacity'] = (int)$bus['capacity'];
        }

        sendResponse(['buses' => $buses]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des bus', 500);
    }
}

// POST - Créer un bus
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['busId']) || !isset($input['matricule']) || !isset($input['capacity'])) {
        sendError('Données incomplètes');
    }

    try {
        $id = generateUUID();
        
        $stmt = $pdo->prepare("
            INSERT INTO buses (
                id, bus_id, matricule, capacity, driver_id, 
                supervisor_id, route_id, status
            ) VALUES (
                :id, :bus_id, :matricule, :capacity, :driver_id,
                :supervisor_id, :route_id, :status
            )
        ");

        $stmt->execute([
            'id' => $id,
            'bus_id' => $input['busId'],
            'matricule' => $input['matricule'],
            'capacity' => (int)$input['capacity'],
            'driver_id' => $input['driverId'] ?: null,
            'supervisor_id' => $input['supervisorId'] ?: null,
            'route_id' => $input['routeId'] ?: null,
            'status' => $input['status'] ?? 'en_service'
        ]);

        sendResponse([
            'success' => true,
            'busId' => $id,
            'message' => 'Bus créé avec succès'
        ], 201);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la création', 500);
    }
}

// PUT - Mettre à jour un bus
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        sendError('ID du bus requis');
    }

    try {
        $updates = [];
        $params = ['id' => $input['id']];

        $fields = ['busId' => 'bus_id', 'matricule' => 'matricule', 
                   'capacity' => 'capacity', 'driverId' => 'driver_id',
                   'supervisorId' => 'supervisor_id', 'routeId' => 'route_id',
                   'status' => 'status'];

        foreach ($fields as $key => $col) {
            if (isset($input[$key])) {
                $updates[] = "$col = :$key";
                $params[$key] = $input[$key] ?: null;
            }
        }

        if (empty($updates)) {
            sendError('Aucune donnée à mettre à jour');
        }

        $sql = "UPDATE buses SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse([
            'success' => true,
            'message' => 'Bus mis à jour avec succès'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour', 500);
    }
}

// DELETE - Supprimer un bus
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        sendError('ID du bus requis');
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM buses WHERE id = :id");
        $stmt->execute(['id' => $_GET['id']]);

        sendResponse([
            'success' => true,
            'message' => 'Bus supprimé avec succès'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la suppression', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>