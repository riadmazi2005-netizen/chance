<?php
// tutor_register.php - Inscription d'un nouveau tuteur
error_log('🔷 tutor_register.php called');

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

// Lire les données JSON
$rawInput = file_get_contents('php://input');
error_log('📥 Raw input: ' . $rawInput);

$input = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendError('Erreur de parsing JSON: ' . json_last_error_msg());
}

error_log('📦 Decoded input: ' . print_r($input, true));

// Validation des champs requis
$required = ['firstName', 'lastName', 'cin', 'phone', 'email', 'password', 'address'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        sendError("Le champ $field est requis");
    }
}

try {
    $pdo->beginTransaction();
    error_log('✅ Transaction started');

    // Vérifier que le CIN, email et téléphone ne sont pas déjà utilisés
    $stmt = $pdo->prepare("
        SELECT id, cin, email, phone FROM users 
        WHERE cin = :cin OR email = :email OR phone = :phone
    ");
    $stmt->execute([
        'cin' => trim($input['cin']),
        'email' => trim($input['email']),
        'phone' => trim($input['phone'])
    ]);

    $existing = $stmt->fetch();
    if ($existing) {
        error_log('❌ Duplicate found: ' . print_r($existing, true));
        
        // Déterminer quel champ est en double
        $duplicateField = '';
        if ($existing['cin'] === trim($input['cin'])) {
            $duplicateField = 'CIN';
        } elseif ($existing['email'] === trim($input['email'])) {
            $duplicateField = 'Email';
        } elseif ($existing['phone'] === trim($input['phone'])) {
            $duplicateField = 'Téléphone';
        }
        
        sendError("$duplicateField déjà utilisé");
    }

    error_log('✅ No duplicates found');

    // Créer l'utilisateur
    $userId = generateUUID();
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

    error_log("🔐 Password hashed for user: $userId");

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
        'email' => trim($input['email']),
        'phone' => trim($input['phone']),
        'password' => $hashedPassword,
        'first_name' => trim($input['firstName']),
        'last_name' => trim($input['lastName']),
        'cin' => trim($input['cin'])
    ]);

    error_log("✅ User created with ID: $userId");

    // Créer le tuteur
    $tutorId = generateUUID();
    $stmt = $pdo->prepare("
        INSERT INTO tutors (id, user_id, address)
        VALUES (:id, :user_id, :address)
    ");

    $stmt->execute([
        'id' => $tutorId,
        'user_id' => $userId,
        'address' => trim($input['address'])
    ]);

    error_log("✅ Tutor created with ID: $tutorId");

    $pdo->commit();
    error_log('✅ Transaction committed successfully');

    // Préparer la réponse
    $response = [
        'success' => true,
        'tutorId' => $tutorId,
        'message' => 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
        'tutor' => [
            'id' => $tutorId,
            'userId' => $userId,
            'type' => 'tutor',
            'email' => trim($input['email']),
            'phone' => trim($input['phone']),
            'firstName' => trim($input['firstName']),
            'lastName' => trim($input['lastName']),
            'cin' => trim($input['cin']),
            'address' => trim($input['address'])
        ]
    ];

    error_log('✅ Registration successful, sending response');
    sendResponse($response, 201);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
        error_log('⚠️ Transaction rolled back');
    }
    
    error_log('❌ Database error: ' . $e->getMessage());
    error_log('❌ SQL State: ' . $e->getCode());
    error_log('❌ Stack trace: ' . $e->getTraceAsString());
    
    // Gérer les erreurs de clé dupliquée
    if ($e->getCode() == 23000) {
        sendError('Un compte existe déjà avec ces informations', 409);
    }
    
    sendError('Erreur lors de l\'inscription: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log('❌ General error: ' . $e->getMessage());
    sendError('Erreur serveur: ' . $e->getMessage(), 500);
}
?>