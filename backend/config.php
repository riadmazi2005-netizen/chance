<?php
// config.php - Configuration de la base de données
// Port MySQL: 3307 (au lieu du port par défaut 3306)

// Paramètres de connexion
define('DB_HOST', 'localhost:3307');  // ⚠️ PORT 3307 AU LIEU DE 3306
define('DB_NAME', 'transport_scolaire');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Connexion PDO
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
    // Log de succès
    error_log('✅ Database connected successfully');
} catch (PDOException $e) {
    // Log de l'erreur
    error_log('❌ Database connection error: ' . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur de connexion à la base de données',
        'details' => $e->getMessage(),
        'host' => DB_HOST,
        'database' => DB_NAME
    ]);
    exit;
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Fonction pour générer un UUID
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Fonction pour envoyer une réponse JSON
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Fonction pour envoyer une erreur
function sendError($message, $statusCode = 400) {
    error_log("❌ Error: $message");
    http_response_code($statusCode);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Handler d'exceptions global
set_exception_handler(function($e) {
    error_log('❌ Uncaught exception: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    sendError('Une erreur est survenue: ' . $e->getMessage(), 500);
});

// Log des requêtes
error_log('📥 Request: ' . $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI']);
?>