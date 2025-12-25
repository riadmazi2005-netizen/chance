<?php
// tutor_register.php - Inscription d'un nouveau tuteur
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Validation des champs requis
$required = ['firstName', 'lastName', 'cin', 'phone', 'email', 'password', 'address'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        sendError("Le champ $field est requis");
    }
}

try {
    $pdo->beginTransaction();

    // Vérifier que le CIN, email et téléphone ne sont pas déjà utilisés
    $stmt = $pdo->prepare("
        SELECT id FROM users 
        WHERE cin = :cin OR email = :email OR phone = :phone
    ");
    $stmt->execute([
        'cin' => $input['cin'],
        'email' => $input['email'],
        'phone' => $input['phone']
    ]);

    if ($stmt->fetch()) {
        sendError('CIN, email ou téléphone déjà utilisé');
    }

    // Créer l'utilisateur
    $userId = generateUUID();
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO users (
            id, user_type, email, phone, password,
            first_name, last_name, cin, status
        ) VALUES (
            :id, 'tutor', :email, :phone, :password,
            :first_name, :last_name, :cin, 'active'
        )
    ");

    $stmt->execute([
        'id' => $userId,
        'email' => $input['email'],
        'phone' => $input['phone'],
        'password' => $hashedPassword,
        'first_name' => $input['firstName'],
        'last_name' => $input['lastName'],
        'cin' => $input['cin']
    ]);

    // Créer le tuteur
    $tutorId = generateUUID();
    $stmt = $pdo->prepare("
        INSERT INTO tutors (id, user_id, address)
        VALUES (:id, :user_id, :address)
    ");

    $stmt->execute([
        'id' => $tutorId,
        'user_id' => $userId,
        'address' => $input['address']
    ]);

    $pdo->commit();

    // Préparer la réponse
    $response = [
        'success' => true,
        'tutorId' => $tutorId,
        'message' => 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
        'tutor' => [
            'id' => $tutorId,
            'userId' => $userId,
            'type' => 'tutor',
            'email' => $input['email'],
            'phone' => $input['phone'],
            'firstName' => $input['firstName'],
            'lastName' => $input['lastName'],
            'cin' => $input['cin'],
            'address' => $input['address']
        ]
    ];

    sendResponse($response, 201);

} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Database error: ' . $e->getMessage());
    sendError('Erreur lors de l\'inscription', 500);
}
?>