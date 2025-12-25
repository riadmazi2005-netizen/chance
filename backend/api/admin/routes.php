<?php
// ============================================
// 9. api/admin/routes.php
// ============================================
function getRoutes() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT r.*, 
                  (SELECT bus_id FROM buses WHERE route_id = r.id LIMIT 1) as bus_name
                  FROM routes r 
                  ORDER BY route_id";
        $stmt = $db->query($query);
        $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Trajets récupérés", $routes);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createRoute() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    $error = validateRequired($data, ['route_id', 'departure', 'terminus']);
    if ($error) sendResponse(400, $error);
    
    try {
        $id = generateUUID();
        $query = "INSERT INTO routes (id, route_id, departure, terminus, departure_time_morning, arrival_time_morning, departure_time_evening, arrival_time_evening) 
                  VALUES (:id, :route_id, :departure, :terminus, :dept_morning, :arr_morning, :dept_evening, :arr_evening)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":route_id", $data->route_id);
        $stmt->bindParam(":departure", $data->departure);
        $stmt->bindParam(":terminus", $data->terminus);
        $stmt->bindParam(":dept_morning", $data->departure_time_morning);
        $stmt->bindParam(":arr_morning", $data->arrival_time_morning);
        $stmt->bindParam(":dept_evening", $data->departure_time_evening);
        $stmt->bindParam(":arr_evening", $data->arrival_time_evening);
        
        if ($stmt->execute()) {
            sendResponse(201, "Trajet créé avec succès", ['id' => $id]);
        }
        
        sendResponse(500, "Erreur lors de la création");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function updateRoute() {
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
        $query = "UPDATE routes SET 
                  route_id = :route_id,
                  departure = :departure,
                  terminus = :terminus,
                  departure_time_morning = :dept_morning,
                  arrival_time_morning = :arr_morning,
                  departure_time_evening = :dept_evening,
                  arrival_time_evening = :arr_evening
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":route_id", $data->route_id);
        $stmt->bindParam(":departure", $data->departure);
        $stmt->bindParam(":terminus", $data->terminus);
        $stmt->bindParam(":dept_morning", $data->departure_time_morning);
        $stmt->bindParam(":arr_morning", $data->arrival_time_morning);
        $stmt->bindParam(":dept_evening", $data->departure_time_evening);
        $stmt->bindParam(":arr_evening", $data->arrival_time_evening);
        
        if ($stmt->execute()) {
            sendResponse(200, "Trajet modifié avec succès");
        }
        
        sendResponse(500, "Erreur lors de la modification");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function deleteRoute() {
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
        $query = "DELETE FROM routes WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        
        if ($stmt->execute()) {
            sendResponse(200, "Trajet supprimé avec succès");
        }
        
        sendResponse(500, "Erreur lors de la suppression");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>