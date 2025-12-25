<?php
// admin_login.php - Authentification des administrateurs
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['identifier']) || !isset($input['password'])) {
    sendError('Nom d\'utilisateur et mot de passe requis');
}

$identifier = trim($input['identifier']);
$password = $input['password'];

try {
    // Rechercher l'admin par username
    $stmt = $pdo->prepare("
        SELECT 
            a.id as admin_id,
            a.username,
            a.full_name as fullName,
            u.id as user_id,
            u.password,
            u.email,
            u.phone,
            u.status
        FROM admins a
        INNER JOIN users u ON a.user_id = u.id
        WHERE a.username = :username AND u.user_type = 'admin'
    ");
    
    $stmt->execute(['username' => $identifier]);
    $admin = $stmt->fetch();

    if (!$admin) {
        sendError('Nom d\'utilisateur ou mot de passe incorrect', 401);
    }

    // Vérifier le statut
    if ($admin['status'] !== 'active') {
        sendError('Votre compte est suspendu', 403);
    }

    // Vérifier le mot de passe
    if (!password_verify($password, $admin['password'])) {
        sendError('Nom d\'utilisateur ou mot de passe incorrect', 401);
    }

    // Préparer les données de réponse
    $response = [
        'id' => $admin['admin_id'],
        'userId' => $admin['user_id'],
        'type' => 'admin',
        'username' => $admin['username'],
        'fullName' => $admin['fullName'],
        'email' => $admin['email'],
        'phone' => $admin['phone'],
        'status' => $admin['status']
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la connexion', 500);
}
?>