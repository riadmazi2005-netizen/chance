<?php
// ============================================
// api/admin/supervisors.php
// ============================================

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/functions.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --- ROUTAGE AUTOMATIQUE ---
switch($method) {
    case 'GET':
        getSupervisors($db);
        break;
    case 'POST':
        createSupervisor($db);
        break;
    case 'PUT':
        updateSupervisor($db);
        break;
    case 'DELETE':
        deleteSupervisor($db);
        break;
    default:
        sendResponse(405, "Méthode non autorisée");
        break;
}

// --- FONCTIONS ---

function getSupervisors($db) {
    try {
        $query = "SELECT s.*, u.first_name, u.last_name, u.phone, u.email, u.status,
                  (SELECT bus_number FROM buses WHERE supervisor_id = s.id LIMIT 1) as bus_name
                  FROM supervisors s
                  INNER JOIN users u ON s.user_id = u.id
                  ORDER BY u.created_at DESC";
        $stmt = $db->query($query);
        $supervisors = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(200, "Responsables récupérés", $supervisors);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createSupervisor($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $error = validateRequired($data, ['first_name', 'last_name', 'phone', 'password']);
    if ($error) sendResponse(400, $error);
    
    try {
        $db->beginTransaction();
        
        $userId = generateUUID();
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $queryUser = "INSERT INTO users (id, user_type, email, phone, password, first_name, last_name, status) 
                      VALUES (:id, 'supervisor', :email, :phone, :password, :first_name, :last_name, 'active')";
        
        $stmtUser = $db->prepare($queryUser);
        $stmtUser->execute([
            ":id" => $userId,
            ":email" => $data['email'] ?? null,
            ":phone" => $data['phone'],
            ":password" => $hashedPassword,
            ":first_name" => $data['first_name'],
            ":last_name" => $data['last_name']
        ]);
        
        $supervisorId = generateUUID();
        $querySup = "INSERT INTO supervisors (id, user_id, salary) VALUES (:id, :user_id, :salary)";
        $stmtSup = $db->prepare($querySup);
        $stmtSup->execute([
            ":id" => $supervisorId,
            ":user_id" => $userId,
            ":salary" => $data['salary'] ?? 0
        ]);
        
        $db->commit();
        sendResponse(201, "Responsable créé avec succès", ['id' => $supervisorId]);
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function updateSupervisor($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['id'])) sendResponse(400, "ID requis");

    try {
        $db->beginTransaction();
        
        // 1. Récupérer l'user_id lié
        $stmt = $db->prepare("SELECT user_id FROM supervisors WHERE id = ?");
        $stmt->execute([$data['id']]);
        $supervisor = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$supervisor) sendResponse(404, "Responsable non trouvé");

        // 2. Mettre à jour l'utilisateur
        $queryUser = "UPDATE users SET email = :email, phone = :phone, first_name = :first_name, last_name = :last_name";
        $params = [
            ":email" => $data['email'],
            ":phone" => $data['phone'],
            ":first_name" => $data['first_name'],
            ":last_name" => $data['last_name'],
            ":user_id" => $supervisor['user_id']
        ];

        if (!empty($data['password'])) {
            $queryUser .= ", password = :password";
            $params[":password"] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $queryUser .= " WHERE id = :user_id";
        $db->prepare($queryUser)->execute($params);

        // 3. Mettre à jour le salaire du superviseur
        $stmtSup = $db->prepare("UPDATE supervisors SET salary = :salary WHERE id = :id");
        $stmtSup->execute([":salary" => $data['salary'], ":id" => $data['id']]);

        $db->commit();
        sendResponse(200, "Responsable modifié avec succès");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteSupervisor($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendResponse(400, "ID requis");

    try {
        // Suppression via la table USER pour déclencher le CASCADE (si configuré)
        $stmt = $db->prepare("DELETE u FROM users u INNER JOIN supervisors s ON s.user_id = u.id WHERE s.id = ?");
        if ($stmt->execute([$id])) {
            sendResponse(200, "Responsable supprimé avec succès");
        }
    } catch (Exception $e) {
        sendResponse(500, "Erreur lors de la suppression: " . $e->getMessage());
    }
}
?>