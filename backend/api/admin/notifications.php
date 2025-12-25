<?php
/ ============================================
// 14. api/admin/notifications.php
// ============================================
function getNotifications() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT * FROM notifications 
                  WHERE recipient_type = 'admin'
                  ORDER BY created_at DESC";
        $stmt = $db->query($query);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Notifications récupérées", $notifications);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function markNotificationAsRead() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->notification_id)) {
        sendResponse(400, "ID notification requis");
    }
    
    try {
        $query = "UPDATE notifications SET is_read = TRUE WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->notification_id);
        
        if ($stmt->execute()) {
            sendResponse(200, "Notification marquée comme lue");
        }
        
        sendResponse(500, "Erreur lors de la mise à jour");
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function getRaiseRequests() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT rr.*,
                  CASE 
                    WHEN rr.requester_type = 'driver' THEN 
                      (SELECT CONCAT(u.first_name, ' ', u.last_name) 
                       FROM drivers d 
                       INNER JOIN users u ON d.user_id = u.id 
                       WHERE d.id = rr.requester_id)
                    ELSE 
                      (SELECT CONCAT(u.first_name, ' ', u.last_name) 
                       FROM supervisors s 
                       INNER JOIN users u ON s.user_id = u.id 
                       WHERE s.id = rr.requester_id)
                  END as requester_name
                  FROM raise_requests rr
                  WHERE rr.status = 'pending'
                  ORDER BY rr.created_at DESC";
        $stmt = $db->query($query);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Demandes d'augmentation récupérées", $requests);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function handleRaiseRequest() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->request_id) || !isset($data->approved)) {
        sendResponse(400, "Données requises manquantes");
    }
    
    try {
        $db->beginTransaction();
        
        // Récupérer la demande
        $query = "SELECT * FROM raise_requests WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->request_id);
        $stmt->execute();
        $request = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$request) {
            sendResponse(404, "Demande non trouvée");
        }
        
        // Mettre à jour le statut de la demande
        $status = $data->approved ? 'approved' : 'rejected';
        $query = "UPDATE raise_requests SET status = :status WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $data->request_id);
        $stmt->execute();
        
        // Créer notification
        $notifId = generateUUID();
        $title = $data->approved ? "Demande d'augmentation approuvée" : "Demande d'augmentation refusée";
        $message = $data->approved 
            ? "Votre demande d'augmentation a été approuvée. Contactez l'administration pour plus de détails."
            : "Votre demande d'augmentation a été refusée.";
        
        $query = "INSERT INTO notifications (id, recipient_id, recipient_type, type, title, message, sender_type) 
                  VALUES (:id, :recipient_id, :recipient_type, 'general', :title, :message, 'admin')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $notifId);
        $stmt->bindParam(":recipient_id", $request['requester_id']);
        $stmt->bindParam(":recipient_type", $request['requester_type']);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":message", $message);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(200, "Demande traitée avec succès");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

?>