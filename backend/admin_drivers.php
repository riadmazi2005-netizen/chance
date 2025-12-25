<?php
// admin_drivers.php - Gestion CRUD des chauffeurs
require_once 'config.php';

// GET - Récupérer tous les chauffeurs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                d.id,
                u.id as userId,
                u.first_name as firstName,
                u.last_name as lastName,
                u.cin,
                u.phone,
                u.email,
                u.status,
                d.license_number as licenseNumber,
                d.age,
                d.salary,
                d.accident_count as accidentCount,
                b.bus_id as busName
            FROM drivers d
            INNER JOIN users u ON d.user_id = u.id
            LEFT JOIN buses b ON d.id = b.driver_id
            ORDER BY u.last_name, u.first_name
        ");
        
        $drivers = $stmt->fetchAll();

        foreach ($drivers as &$driver) {
            $driver['age'] = (int)$driver['age'];
            $driver['salary'] = (float)$driver['salary'];
            $driver['accidentCount'] = (int)$driver['accidentCount'];
        }

        sendResponse(['drivers' => $drivers]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération', 500);
    }
}

// POST - Créer un chauffeur
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['firstName', 'lastName', 'cin', 'phone', 'licenseNumber', 'password'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendError("Le champ $field est requis");
        }
    }

    try {
        $pdo->beginTransaction();

        // Vérifier unicité CIN, phone, email
        $stmt = $pdo->prepare("SELECT id FROM users WHERE cin = :cin OR phone = :phone");
        $stmt->execute(['cin' => $input['cin'], 'phone' => $input['phone']]);
        if ($stmt->fetch()) {
            sendError('CIN ou téléphone déjà utilisé');
        }

        // Créer l'utilisateur
        $userId = generateUUID();
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO users (
                id, user_type, email, phone, password, 
                first_name, last_name, cin, status
            ) VALUES (
                :id, 'driver', :email, :phone, :password,
                :first_name, :last_name, :cin, :status
            )
        ");

        $stmt->execute([
            'id' => $userId,
            'email' => $input['email'] ?? '',
            'phone' => $input['phone'],
            'password' => $hashedPassword,
            'first_name' => $input['firstName'],
            'last_name' => $input['lastName'],
            'cin' => $input['cin'],
            'status' => $input['status'] ?? 'active'
        ]);

        // Créer le chauffeur
        $driverId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO drivers (
                id, user_id, license_number, age, salary, accident_count
            ) VALUES (
                :id, :user_id, :license_number, :age, :salary, 0
            )
        ");

        $stmt->execute([
            'id' => $driverId,
            'user_id' => $userId,
            'license_number' => $input['licenseNumber'],
            'age' => isset($input['age']) ? (int)$input['age'] : null,
            'salary' => isset($input['salary']) ? (float)$input['salary'] : 0
        ]);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'driverId' => $driverId,
            'message' => 'Chauffeur créé avec succès'
        ], 201);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la création', 500);
    }
}

// PUT - Mettre à jour un chauffeur
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        sendError('ID du chauffeur requis');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer user_id
        $stmt = $pdo->prepare("SELECT user_id FROM drivers WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        $driver = $stmt->fetch();

        if (!$driver) {
            sendError('Chauffeur non trouvé', 404);
        }

        // Mettre à jour users
        $userUpdates = [];
        $userParams = ['id' => $driver['user_id']];

        $userFields = ['firstName' => 'first_name', 'lastName' => 'last_name',
                       'cin' => 'cin', 'phone' => 'phone', 'email' => 'email',
                       'status' => 'status'];

        foreach ($userFields as $key => $col) {
            if (isset($input[$key])) {
                $userUpdates[] = "$col = :$key";
                $userParams[$key] = $input[$key];
            }
        }

        // Mettre à jour le mot de passe si fourni
        if (isset($input['password']) && !empty($input['password'])) {
            $userUpdates[] = "password = :password";
            $userParams['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        if (!empty($userUpdates)) {
            $sql = "UPDATE users SET " . implode(', ', $userUpdates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($userParams);
        }

        // Mettre à jour drivers
        $driverUpdates = [];
        $driverParams = ['id' => $input['id']];

        $driverFields = ['licenseNumber' => 'license_number', 'age' => 'age', 'salary' => 'salary'];

        foreach ($driverFields as $key => $col) {
            if (isset($input[$key])) {
                $driverUpdates[] = "$col = :$key";
                $driverParams[$key] = $input[$key];
            }
        }

        if (!empty($driverUpdates)) {
            $sql = "UPDATE drivers SET " . implode(', ', $driverUpdates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($driverParams);
        }

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => 'Chauffeur mis à jour avec succès'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour', 500);
    }
}

// DELETE - Supprimer un chauffeur
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        sendError('ID du chauffeur requis');
    }

    try {
        // La suppression en cascade supprimera aussi dans users
        $stmt = $pdo->prepare("DELETE FROM drivers WHERE id = :id");
        $stmt->execute(['id' => $_GET['id']]);

        sendResponse([
            'success' => true,
            'message' => 'Chauffeur supprimé avec succès'
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