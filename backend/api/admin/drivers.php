<?php
// ============================================
// api/admin/drivers.php
// ============================================

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/functions.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// --- ROUTAGE DES ACTIONS ---

switch($method) {
    case 'GET':
        getDrivers($db);
        break;
    case 'POST':
        createDriver($db);
        break;
    case 'PUT':
        updateDriver($db);
        break;
    case 'DELETE':
        deleteDriver($db);
        break;
    default:
        sendResponse(405, "Méthode non autorisée");
        break;
}

// --- DÉFINITION DES FONCTIONS ---

function getDrivers($db) {
    try {
        $query = "SELECT d.*, u.first_name, u.last_name, u.phone, u.email, u.cin, u.status,
                  (SELECT bus_number FROM buses WHERE driver_id = d.id LIMIT 1) as bus_name
                  FROM drivers d
                  INNER JOIN users u ON d.user_id = u.id
                  ORDER BY u.created_at DESC";
        $stmt = $db->query($query);
        $drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(200, "Chauffeurs récupérés", $drivers);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createDriver($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $error = validateRequired($data, ['first_name', 'last_name', 'phone', 'license_number', 'password']);
    if ($error) sendResponse(400, $error);
    
    try {
        $db->beginTransaction();
        
        $userId = generateUUID();
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $queryUser = "INSERT INTO users (id, user_type, email, phone, password, first_name, last_name, cin, status) 
                      VALUES (:id, 'driver', :email, :phone, :password, :first_name, :last_name, :cin, :status)";
        
        $stmtUser = $db->prepare($queryUser);
        $stmtUser->execute([
            ":id" => $userId,
            ":email" => $data['email'] ?? null,
            ":phone" => $data['phone'],
            ":password" => $hashedPassword,
            ":first_name" => $data['first_name'],
            ":last_name" => $data['last_name'],
            ":cin" => $data['cin'] ?? null,
            ":status" => $data['status'] ?? 'active'
        ]);
        
        $driverId = generateUUID();
        $queryDriver = "INSERT INTO drivers (id, user_id, license_number, age, salary) 
                        VALUES (:id, :user_id, :license_number, :age, :salary)";
        
        $stmtDriver = $db->prepare($queryDriver);
        $stmtDriver->execute([
            ":id" => $driverId,
            ":user_id" => $userId,
            ":license_number" => $data['license_number'],
            ":age" => $data['age'] ?? null,
            ":salary" => $data['salary'] ?? 0
        ]);
        
        $db->commit();
        sendResponse(201, "Chauffeur créé avec succès", ['id' => $driverId]);
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur lors de la création: " . $e->getMessage());
    }
}

function updateDriver($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['id'])) sendResponse(400, "ID du chauffeur requis");

    try {
        $db->beginTransaction();
        
        // Mise à jour table USERS
        $queryUser = "UPDATE users u 
                      INNER JOIN drivers d ON d.user_id = u.id
                      SET u.first_name = :first_name, u.last_name = :last_name, u.phone = :phone, u.status = :status
                      WHERE d.id = :id";
        $db->prepare($queryUser)->execute([
            ":first_name" => $data['first_name'],
            ":last_name" => $data['last_name'],
            ":phone" => $data['phone'],
            ":status" => $data['status'],
            ":id" => $data['id']
        ]);

        // Mise à jour table DRIVERS
        $queryDriver = "UPDATE drivers SET license_number = :license, age = :age, salary = :salary WHERE id = :id";
        $db->prepare($queryDriver)->execute([
            ":license" => $data['license_number'],
            ":age" => $data['age'],
            ":salary" => $data['salary'],
            ":id" => $data['id']
        ]);

        $db->commit();
        sendResponse(200, "Chauffeur mis à jour");
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteDriver($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendResponse(400, "ID requis");

    try {
        // Le ON DELETE CASCADE dans SQL s'occupera de supprimer l'utilisateur lié si configuré
        // Sinon, on supprime l'utilisateur manuellement
        $stmt = $db->prepare("DELETE u FROM users u INNER JOIN drivers d ON d.user_id = u.id WHERE d.id = ?");
        $stmt->execute([$id]);
        sendResponse(200, "Chauffeur supprimé");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
// Suite de createDriver() depuis api/admin/drivers.php
function createDriver_COMPLETE() {
    // ... (début déjà dans le fichier précédent)
    try {
        $db->beginTransaction();
        
        $userId = generateUUID();
        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (id, user_type, email, phone, password, first_name, last_name, cin, status) 
                  VALUES (:id, 'driver', :email, :phone, :password, :first_name, :last_name, :cin, :status)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $userId);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":phone", $data->phone);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":first_name", $data->first_name);
        $stmt->bindParam(":last_name", $data->last_name);
        $stmt->bindParam(":cin", $data->cin);
        $stmt->bindParam(":status", $data->status);
        $stmt->execute();
        
        $driverId = generateUUID();
        $query = "INSERT INTO drivers (id, user_id, license_number, age, salary) 
                  VALUES (:id, :user_id, :license_number, :age, :salary)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $driverId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":license_number", $data->license_number);
        $stmt->bindParam(":age", $data->age);
        $stmt->bindParam(":salary", $data->salary);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(201, "Chauffeur créé avec succès", ['id' => $driverId]);
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function updateDriver() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        sendResponse(400, "ID requis");
    }
    
    try {
        $db->beginTransaction();
        
        // Récupérer user_id
        $query = "SELECT user_id FROM drivers WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->execute();
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$driver) {
            sendResponse(404, "Chauffeur non trouvé");
        }
        
        // Mettre à jour l'utilisateur
        $query = "UPDATE users SET 
                  email = :email,
                  phone = :phone,
                  first_name = :first_name,
                  last_name = :last_name,
                  cin = :cin,
                  status = :status";
        
        if (!empty($data->password)) {
            $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
            $query .= ", password = :password";
        }
        
        $query .= " WHERE id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $driver['user_id']);
        $stmt->bindParam(":email", $data->email);
        $stmt->bindParam(":phone", $data->phone);
        $stmt->bindParam(":first_name", $data->first_name);
        $stmt->bindParam(":last_name", $data->last_name);
        $stmt->bindParam(":cin", $data->cin);
        $stmt->bindParam(":status", $data->status);
        
        if (!empty($data->password)) {
            $stmt->bindParam(":password", $hashedPassword);
        }
        
        $stmt->execute();
        
        // Mettre à jour le chauffeur
        $query = "UPDATE drivers SET 
                  license_number = :license_number,
                  age = :age,
                  salary = :salary
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":license_number", $data->license_number);
        $stmt->bindParam(":age", $data->age);
        $stmt->bindParam(":salary", $data->salary);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(200, "Chauffeur modifié avec succès");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteDriver() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $id = $_GET['id'] ?? null;
    
    if (empty($id)) {
        sendResponse(400, "ID requis");
    }
    
    try {
        // La suppression en cascade se charge du reste
        $query = "DELETE FROM drivers WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            sendResponse(200, "Chauffeur supprimé avec succès");
        }
        
        sendResponse(500, "Erreur lors de la suppression");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>