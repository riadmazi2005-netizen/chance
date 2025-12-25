<?php
// backend/api/admin/admins.php

require_once '../../includes/cors.php';
require_once '../../config/database.php';
require_once '../../includes/functions.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        getAdmins($db);
        break;
    case 'POST':
        createAdmin($db);
        break;
    case 'PUT':
        updateAdmin($db);
        break;
    case 'DELETE':
        deleteAdmin($db);
        break;
    default:
        sendResponse(405, "Méthode non autorisée");
        break;
}

function getAdmins($db) {
    try {
        // Récupère les admins avec leurs informations de base dans la table users
        $query = "SELECT u.id, u.first_name, u.last_name, u.email, u.phone, a.username, a.role_level, u.status, u.created_at 
                  FROM users u 
                  INNER JOIN admins a ON u.id = a.user_id 
                  WHERE u.user_type = 'admin'
                  ORDER BY u.created_at DESC";
        
        $stmt = $db->query($query);
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Liste des administrateurs récupérée", $admins);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createAdmin($db) {
    $data = json_decode(file_get_contents("php://input"));
    $error = validateRequired($data, ['first_name', 'last_name', 'email', 'username', 'password']);
    if ($error) sendResponse(400, $error);

    try {
        $db->beginTransaction();
        $userId = generateUUID();
        
        // 1. Insertion dans la table users
        $q1 = "INSERT INTO users (id, first_name, last_name, email, phone, password, user_type, status) 
               VALUES (:id, :fname, :lname, :email, :phone, :pass, 'admin', 'active')";
        $stmt1 = $db->prepare($q1);
        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
        
        $stmt1->execute([
            ':id' => $userId,
            ':fname' => $data->first_name,
            ':lname' => $data->last_name,
            ':email' => $data->email,
            ':phone' => $data->phone ?? null,
            ':pass' => $hashedPassword
        ]);

        // 2. Insertion dans la table admins
        $q2 = "INSERT INTO admins (id, user_id, username, role_level) VALUES (:id, :uid, :uname, :role)";
        $stmt2 = $db->prepare($q2);
        $stmt2->execute([
            ':id' => generateUUID(),
            ':uid' => $userId,
            ':uname' => $data->username,
            ':role' => $data->role_level ?? 1
        ]);

        $db->commit();
        sendResponse(201, "Administrateur créé avec succès");
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function updateAdmin($db) {
    $data = json_decode(file_get_contents("php://input"));
    if (empty($data->id)) sendResponse(400, "ID requis");

    try {
        $q = "UPDATE users u 
              INNER JOIN admins a ON u.id = a.user_id 
              SET u.first_name = :fname, u.last_name = :lname, u.email = :email, a.username = :uname 
              WHERE u.id = :id";
        $stmt = $db->prepare($q);
        $stmt->execute([
            ':id' => $data->id,
            ':fname' => $data->first_name,
            ':lname' => $data->last_name,
            ':email' => $data->email,
            ':uname' => $data->username
        ]);
        sendResponse(200, "Administrateur modifié");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteAdmin($db) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendResponse(400, "ID requis");

    try {
        // La suppression de l'utilisateur supprimera l'admin via ON DELETE CASCADE si configuré
        $stmt = $db->prepare("DELETE FROM users WHERE id = :id AND user_type = 'admin'");
        $stmt->execute([':id' => $id]);
        sendResponse(200, "Administrateur supprimé");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}