<?php
// driver_profile.php - Mise à jour du profil du chauffeur
require_once 'config.php';

// PUT - Mettre à jour le profil
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['driver_id'])) {
        sendError('ID du chauffeur requis');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer l'user_id du chauffeur
        $stmt = $pdo->prepare("
            SELECT user_id FROM drivers WHERE id = :driver_id
        ");
        $stmt->execute(['driver_id' => $input['driver_id']]);
        $driver = $stmt->fetch();

        if (!$driver) {
            sendError('Chauffeur non trouvé', 404);
        }

        // Préparer les champs à mettre à jour
        $updates = [];
        $params = ['user_id' => $driver['user_id']];

        if (isset($input['phone'])) {
            // Vérifier que le téléphone n'est pas déjà utilisé
            $stmt = $pdo->prepare("
                SELECT id FROM users 
                WHERE phone = :phone AND id != :user_id
            ");
            $stmt->execute([
                'phone' => $input['phone'],
                'user_id' => $driver['user_id']
            ]);
            if ($stmt->fetch()) {
                sendError('Ce numéro de téléphone est déjà utilisé');
            }
            $updates[] = "phone = :phone";
            $params['phone'] = $input['phone'];
        }

        if (isset($input['email'])) {
            // Vérifier que l'email n'est pas déjà utilisé
            $stmt = $pdo->prepare("
                SELECT id FROM users 
                WHERE email = :email AND id != :user_id
            ");
            $stmt->execute([
                'email' => $input['email'],
                'user_id' => $driver['user_id']
            ]);
            if ($stmt->fetch()) {
                sendError('Cet email est déjà utilisé');
            }
            $updates[] = "email = :email";
            $params['email'] = $input['email'];
        }

        if (empty($updates)) {
            sendError('Aucune donnée à mettre à jour');
        }

        // Mettre à jour les informations
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :user_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $pdo->commit();

        // Récupérer les données mises à jour
        $stmt = $pdo->prepare("
            SELECT 
                u.id as user_id,
                u.email,
                u.phone,
                u.first_name as firstName,
                u.last_name as lastName,
                u.cin,
                u.status,
                d.id as driver_id,
                d.license_number as licenseNumber,
                d.age,
                d.salary,
                d.accident_count as accidentCount
            FROM users u
            INNER JOIN drivers d ON u.id = d.user_id
            WHERE d.id = :driver_id
        ");
        $stmt->execute(['driver_id' => $input['driver_id']]);
        $updated = $stmt->fetch();

        // Convertir les valeurs numériques
        $updated['age'] = (int)$updated['age'];
        $updated['salary'] = (float)$updated['salary'];
        $updated['accidentCount'] = (int)$updated['accidentCount'];

        sendResponse([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'data' => $updated
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour du profil', 500);
    }
}

// GET - Récupérer le profil
elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['driver_id'])) {
        sendError('ID du chauffeur requis');
    }

    try {
        $stmt = $pdo->prepare("
            SELECT 
                u.id as user_id,
                u.email,
                u.phone,
                u.first_name as firstName,
                u.last_name as lastName,
                u.cin,
                u.status,
                d.id as driver_id,
                d.license_number as licenseNumber,
                d.age,
                d.salary,
                d.accident_count as accidentCount
            FROM users u
            INNER JOIN drivers d ON u.id = d.user_id
            WHERE d.id = :driver_id
        ");
        $stmt->execute(['driver_id' => $_GET['driver_id']]);
        $driver = $stmt->fetch();

        if (!$driver) {
            sendError('Chauffeur non trouvé', 404);
        }

        // Convertir les valeurs numériques
        $driver['age'] = (int)$driver['age'];
        $driver['salary'] = (float)$driver['salary'];
        $driver['accidentCount'] = (int)$driver['accidentCount'];

        sendResponse($driver);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération du profil', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>