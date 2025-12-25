<?php
// supervisor_login.php - Authentification des responsables bus
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['identifier']) || !isset($input['password'])) {
    sendError('Identifiant et mot de passe requis');
}

$identifier = trim($input['identifier']);
$password = $input['password'];

try {
    // Rechercher le superviseur par email ou téléphone
    $stmt = $pdo->prepare("
        SELECT 
            u.id as user_id,
            u.email,
            u.phone,
            u.password,
            u.first_name,
            u.last_name,
            u.cin,
            u.status,
            s.id as supervisor_id,
            s.salary
        FROM users u
        INNER JOIN supervisors s ON u.id = s.user_id
        WHERE u.user_type = 'supervisor' 
        AND (u.email = :identifier OR u.phone = :identifier)
    ");
    
    $stmt->execute(['identifier' => $identifier]);
    $supervisor = $stmt->fetch();

    if (!$supervisor) {
        sendError('Email/téléphone ou mot de passe incorrect', 401);
    }

    // Vérifier le statut du superviseur
    if ($supervisor['status'] !== 'active') {
        sendError('Votre compte est suspendu. Contactez l\'administration.', 403);
    }

    // Vérifier le mot de passe
    if (!password_verify($password, $supervisor['password'])) {
        sendError('Email/téléphone ou mot de passe incorrect', 401);
    }

    // Préparer les données de réponse
    $response = [
        'id' => $supervisor['supervisor_id'],
        'userId' => $supervisor['user_id'],
        'type' => 'supervisor',
        'email' => $supervisor['email'],
        'phone' => $supervisor['phone'],
        'firstName' => $supervisor['first_name'],
        'lastName' => $supervisor['last_name'],
        'cin' => $supervisor['cin'],
        'salary' => (float)$supervisor['salary'],
        'status' => $supervisor['status']
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la connexion', 500);
}
?>