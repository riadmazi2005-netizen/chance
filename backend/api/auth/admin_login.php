<?php
// backend/api/auth/admin_login.php

error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher les erreurs PHP dans la réponse JSON
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fonction pour envoyer une réponse JSON
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit();
}

// Vérifier que c'est bien une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Méthode non autorisée. Utilisez POST.', null, 405);
}

try {
    // Inclure la configuration de la base de données
    require_once '../../config/database.php';

    // Récupérer les données JSON
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // Vérifier que le JSON est valide
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonResponse(false, 'JSON invalide: ' . json_last_error_msg(), null, 400);
    }

    // Validation des données
    if (empty($data['username'])) {
        sendJsonResponse(false, 'Nom d\'utilisateur requis', null, 400);
    }

    if (empty($data['password'])) {
        sendJsonResponse(false, 'Mot de passe requis', null, 400);
    }

    // Connexion à la base de données
    $database = new Database();
    $db = $database->connect();

    // Vérifier si la table admins existe
    $checkTable = "SHOW TABLES LIKE 'admins'";
    $stmt = $db->query($checkTable);

    if ($stmt->rowCount() === 0) {
        sendJsonResponse(false, 'Table admins non trouvée. Veuillez créer la base de données.', null, 500);
    }

    // Vérifier si un admin existe
    $query = "SELECT COUNT(*) as count FROM admins";
    $stmt = $db->query($query);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Si aucun admin n'existe, créer l'admin par défaut
    if ($result['count'] == 0) {
        $defaultUsername = 'admin';
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $adminId = uniqid('admin_', true);

        $insertQuery = "INSERT INTO admins (id, username, password, full_name, created_at) 
                       VALUES (:id, :username, :password, 'Administrateur Principal', NOW())";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->execute([
            ':id' => $adminId,
            ':username' => $defaultUsername,
            ':password' => $defaultPassword
        ]);
    }

    // Rechercher l'admin avec le username fourni
    $query = "SELECT * FROM admins WHERE username = :username LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute([':username' => $data['username']]);

    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    // Vérifier si l'admin existe
    if (!$admin) {
        sendJsonResponse(false, 'Nom d\'utilisateur incorrect', null, 401);
    }

    // Vérifier le mot de passe
    if (!password_verify($data['password'], $admin['password'])) {
        sendJsonResponse(false, 'Mot de passe incorrect', null, 401);
    }

    // Connexion réussie
    // Ne pas retourner le mot de passe
    unset($admin['password']);

    // Préparer les données de réponse
    $responseData = [
        'id' => $admin['id'],
        'username' => $admin['username'],
        'fullName' => $admin['full_name'],
        'type' => 'admin'
    ];

    sendJsonResponse(true, 'Connexion réussie', $responseData, 200);

} catch (PDOException $e) {
    sendJsonResponse(false, 'Erreur de base de données: ' . $e->getMessage(), null, 500);
} catch (Exception $e) {
    sendJsonResponse(false, 'Erreur serveur: ' . $e->getMessage(), null, 500);
}
?>