<?php
// admin_supervisors.php - Gestion CRUD des responsables bus
require_once 'config.php';

// GET - Récupérer tous les superviseurs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                s.id,
                u.id as userId,
                u.first_name as firstName,
                u.last_name as lastName,
                u.phone,
                u.email,
                u.status,
                s.salary,
                b.bus_id as busName
            FROM supervisors s
            INNER JOIN users u ON s.user_id = u.id
            LEFT JOIN buses b ON s.id = b.supervisor_id
            ORDER BY u.last_name, u.first_name
        ");
        
        $supervisors = $stmt->fetchAll();

        foreach ($supervisors as &$supervisor) {
            $supervisor['salary'] = (float)$supervisor['salary'];
        }

        sendResponse(['supervisors' => $supervisors]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération', 500);
    }
}

// POST - Créer un superviseur
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['firstName', 'lastName', 'phone', 'password'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            sendError("Le champ $field est requis");
        }
    }

    try {
        $pdo->beginTransaction();

        // Vérifier unicité phone
        $stmt = $pdo->prepare("SELECT id FROM users WHERE phone = :phone");
        $stmt->execute(['phone' => $input['phone']]);
        if ($stmt->fetch()) {
            sendError('Téléphone déjà utilisé');
        }

        // Créer l'utilisateur
        $userId = generateUUID();
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO users (
                id, user_type, email, phone, password, 
                first_name, last_name, status
            ) VALUES (
                :id, 'supervisor', :email, :phone, :password,
                :first_name, :last_name, 'active'
            )
        ");

        $stmt->execute([
            'id' => $userId,
            'email' => $input['email'] ?? '',
            'phone' => $input['phone'],
            'password' => $hashedPassword,
            'first_name' => $input['firstName'],
            'last_name' => $input['lastName']
        ]);

        // Créer le superviseur
        $supervisorId = generateUUID();
        $stmt = $pdo->prepare("
            INSERT INTO supervisors (id, user_id, salary)
            VALUES (:id, :user_id, :salary)
        ");

        $stmt->execute([
            'id' => $supervisorId,
            'user_id' => $userId,
            'salary' => isset($input['salary']) ? (float)$input['salary'] : 0
        ]);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'supervisorId' => $supervisorId,
            'message' => 'Responsable créé avec succès'
        ], 201);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la création', 500);
    }
}

// PUT - Mettre à jour un superviseur
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['id'])) {
        sendError('ID du superviseur requis');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer user_id
        $stmt = $pdo->prepare("SELECT user_id FROM supervisors WHERE id = :id");
        $stmt->execute(['id' => $input['id']]);
        $supervisor = $stmt->fetch();

        if (!$supervisor) {
            sendError('Superviseur non trouvé', 404);
        }

        // Mettre à jour users
        $userUpdates = [];
        $userParams = ['id' => $supervisor['user_id']];

        $userFields = ['firstName' => 'first_name', 'lastName' => 'last_name',
                       'phone' => 'phone', 'email' => 'email'];

        foreach ($userFields as $key => $col) {
            if (isset($input[$key])) {
                $userUpdates[] = "$col = :$key";
                $userParams[$key] = $input[$key];
            }
        }

        if (isset($input['password']) && !empty($input['password'])) {
            $userUpdates[] = "password = :password";
            $userParams['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        if (!empty($userUpdates)) {
            $sql = "UPDATE users SET " . implode(', ', $userUpdates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($userParams);
        }

        // Mettre à jour supervisors
        if (isset($input['salary'])) {
            $stmt = $pdo->prepare("UPDATE supervisors SET salary = :salary WHERE id = :id");
            $stmt->execute([
                'salary' => (float)$input['salary'],
                'id' => $input['id']
            ]);
        }

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => 'Superviseur mis à jour avec succès'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour', 500);
    }
}

// DELETE - Supprimer un superviseur
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        sendError('ID du superviseur requis');
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM supervisors WHERE id = :id");
        $stmt->execute(['id' => $_GET['id']]);

        sendResponse([
            'success' => true,
            'message' => 'Superviseur supprimé avec succès'
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