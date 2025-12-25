<?php
// tutor_login.php - Authentification des tuteurs
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['identifier']) || !isset($input['password'])) {
    sendError('Email/téléphone et mot de passe requis');
}

$identifier = trim($input['identifier']);
$password = $input['password'];

try {
    // Rechercher le tuteur par email, téléphone ou CIN
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
            t.id as tutor_id,
            t.address
        FROM users u
        INNER JOIN tutors t ON u.id = t.user_id
        WHERE u.user_type = 'tutor' 
        AND (u.email = :identifier OR u.phone = :identifier OR u.cin = :identifier)
    ");
    
    $stmt->execute(['identifier' => $identifier]);
    $tutor = $stmt->fetch();

    if (!$tutor) {
        sendError('Identifiant ou mot de passe incorrect', 401);
    }

    // Vérifier le statut
    if ($tutor['status'] !== 'active') {
        sendError('Votre compte est suspendu. Contactez l\'administration.', 403);
    }

    // Vérifier le mot de passe
    if (!password_verify($password, $tutor['password'])) {
        sendError('Identifiant ou mot de passe incorrect', 401);
    }

    // Préparer les données de réponse
    $response = [
        'id' => $tutor['tutor_id'],
        'userId' => $tutor['user_id'],
        'type' => 'tutor',
        'email' => $tutor['email'],
        'phone' => $tutor['phone'],
        'firstName' => $tutor['first_name'],
        'lastName' => $tutor['last_name'],
        'cin' => $tutor['cin'],
        'address' => $tutor['address'],
        'status' => $tutor['status']
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la connexion', 500);
}
?>