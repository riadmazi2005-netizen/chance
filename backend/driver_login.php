<?php
// driver_login.php - Authentification des chauffeurs
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
    // Rechercher le chauffeur par email, téléphone ou CIN
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
            d.id as driver_id,
            d.license_number,
            d.age,
            d.salary,
            d.accident_count
        FROM users u
        INNER JOIN drivers d ON u.id = d.user_id
        WHERE u.user_type = 'driver' 
        AND (u.email = :identifier OR u.phone = :identifier OR u.cin = :identifier)
    ");
    
    $stmt->execute(['identifier' => $identifier]);
    $driver = $stmt->fetch();

    if (!$driver) {
        sendError('Identifiant ou mot de passe incorrect', 401);
    }

    // Vérifier le statut du chauffeur
    if ($driver['status'] === 'fired') {
        sendError('Votre compte a été désactivé. Contactez l\'administration.', 403);
    }

    if ($driver['status'] !== 'active') {
        sendError('Votre compte est suspendu. Contactez l\'administration.', 403);
    }

    // Vérifier le mot de passe
    if (!password_verify($password, $driver['password'])) {
        sendError('Identifiant ou mot de passe incorrect', 401);
    }

    // Préparer les données de réponse
    $response = [
        'id' => $driver['driver_id'],
        'userId' => $driver['user_id'],
        'type' => 'driver',
        'email' => $driver['email'],
        'phone' => $driver['phone'],
        'firstName' => $driver['first_name'],
        'lastName' => $driver['last_name'],
        'cin' => $driver['cin'],
        'licenseNumber' => $driver['license_number'],
        'age' => (int)$driver['age'],
        'salary' => (float)$driver['salary'],
        'accidentCount' => (int)$driver['accident_count'],
        'status' => $driver['status']
    ];

    sendResponse($response);

} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de la connexion', 500);
}
?>