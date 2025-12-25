<?php

// 8. api/admin/buses.php
// ============================================
function getBuses() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT * FROM v_buses_complete ORDER BY created_at DESC";
        $stmt = $db->query($query);
        $buses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Bus récupérés", $buses);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createBus() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    $error = validateRequired($data, ['bus_id', 'matricule', 'capacity']);
    if ($error) sendResponse(400, $error);
    
    try {
        $id = generateUUID();
        $query = "INSERT INTO buses (id, bus_id, matricule, capacity, driver_id, supervisor_id, route_id, status) 
                  VALUES (:id, :bus_id, :matricule, :capacity, :driver_id, :supervisor_id, :route_id, :status)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":bus_id", $data->bus_id);
        $stmt->bindParam(":matricule", $data->matricule);
        $stmt->bindParam(":capacity", $data->capacity);
        $stmt->bindParam(":driver_id", $data->driver_id);
        $stmt->bindParam(":supervisor_id", $data->supervisor_id);
        $stmt->bindParam(":route_id", $data->route_id);
        $stmt->bindParam(":status", $data->status);
        
        if ($stmt->execute()) {
            sendResponse(201, "Bus créé avec succès", ['id' => $id]);
        }
        
        sendResponse(500, "Erreur lors de la création");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function updateBus() {
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
        $query = "UPDATE buses SET 
                  bus_id = :bus_id,
                  matricule = :matricule,
                  capacity = :capacity,
                  driver_id = :driver_id,
                  supervisor_id = :supervisor_id,
                  route_id = :route_id,
                  status = :status
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":bus_id", $data->bus_id);
        $stmt->bindParam(":matricule", $data->matricule);
        $stmt->bindParam(":capacity", $data->capacity);
        $stmt->bindParam(":driver_id", $data->driver_id);
        $stmt->bindParam(":supervisor_id", $data->supervisor_id);
        $stmt->bindParam(":route_id", $data->route_id);
        $stmt->bindParam(":status", $data->status);
        
        if ($stmt->execute()) {
            sendResponse(200, "Bus modifié avec succès");
        }
        
        sendResponse(500, "Erreur lors de la modification");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteBus() {
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
        $query = "DELETE FROM buses WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            sendResponse(200, "Bus supprimé avec succès");
        }
        
        sendResponse(500, "Erreur lors de la suppression");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>