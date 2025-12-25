<?php
// ============================================
// 12. api/admin/accidents.php
// ============================================
function getAccidents() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT a.*,
                  CONCAT(u.first_name, ' ', u.last_name) as driver_name,
                  b.bus_id as bus_name
                  FROM accidents a
                  INNER JOIN drivers d ON a.driver_id = d.id
                  INNER JOIN users u ON d.user_id = u.id
                  INNER JOIN buses b ON a.bus_id = b.id
                  ORDER BY a.date DESC";
        $stmt = $db->query($query);
        $accidents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Accidents récupérés", $accidents);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function createAccident() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    $error = validateRequired($data, ['driver_id', 'bus_id', 'date', 'report', 'severity']);
    if ($error) sendResponse(400, $error);
    
    try {
        $db->beginTransaction();
        
        $id = generateUUID();
        
        // Créer l'accident
        $query = "INSERT INTO accidents (id, driver_id, bus_id, date, report, severity) 
                  VALUES (:id, :driver_id, :bus_id, :date, :report, :severity)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->bindParam(":driver_id", $data->driver_id);
        $stmt->bindParam(":bus_id", $data->bus_id);
        $stmt->bindParam(":date", $data->date);
        $stmt->bindParam(":report", $data->report);
        $stmt->bindParam(":severity", $data->severity);
        $stmt->execute();
        
        // Le trigger se charge automatiquement de mettre à jour accident_count et status
        // Récupérer le nouveau nombre d'accidents
        $query = "SELECT accident_count FROM drivers WHERE id = :driver_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":driver_id", $data->driver_id);
        $stmt->execute();
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);
        $accidentCount = $driver['accident_count'];
        
        // Créer notification pour le chauffeur
        $notifId = generateUUID();
        $title = "Accident déclaré";
        $message = $accidentCount >= 3 
            ? "⚠️ ATTENTION: Vous avez atteint 3 accidents. Licenciement + 1000 DH amende."
            : "Un accident a été déclaré. Total: {$accidentCount} accident(s).";
        
        $query = "INSERT INTO notifications (id, recipient_id, recipient_type, type, title, message, sender_type) 
                  VALUES (:id, :recipient_id, 'driver', 'accident', :title, :message, 'admin')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $notifId);
        $stmt->bindParam(":recipient_id", $data->driver_id);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":message", $message);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(201, "Accident déclaré avec succès", ['id' => $id, 'accident_count' => $accidentCount]);
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>