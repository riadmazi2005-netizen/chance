<?php
// ============================================
// 11. api/admin/payments.php
// ============================================
function getPayments() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT p.*, 
                  CONCAT(s.first_name, ' ', s.last_name) as student_name,
                  s.class as student_class,
                  CONCAT(u.first_name, ' ', u.last_name) as tutor_name
                  FROM payments p
                  INNER JOIN students s ON p.student_id = s.id
                  INNER JOIN tutors t ON p.tutor_id = t.id
                  INNER JOIN users u ON t.user_id = u.id
                  ORDER BY p.created_at DESC";
        $stmt = $db->query($query);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Paiements récupérés", $payments);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function validatePayment() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->payment_id) || empty($data->bus_id) || empty($data->bus_group)) {
        sendResponse(400, "Données requises manquantes");
    }
    
    try {
        $db->beginTransaction();
        
        // Récupérer les infos du paiement
        $query = "SELECT p.*, s.first_name, s.last_name, s.tutor_id, b.bus_id, b.route_id
                  FROM payments p
                  INNER JOIN students s ON p.student_id = s.id
                  INNER JOIN buses b ON b.id = :bus_id
                  WHERE p.id = :payment_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":payment_id", $data->payment_id);
        $stmt->bindParam(":bus_id", $data->bus_id);
        $stmt->execute();
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payment) {
            sendResponse(404, "Paiement non trouvé");
        }
        
        // Mettre à jour le paiement
        $paymentDate = date('Y-m-d');
        $query = "UPDATE payments SET status = 'paid', payment_date = :payment_date WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->payment_id);
        $stmt->bindParam(":payment_date", $paymentDate);
        $stmt->execute();
        
        // Affecter l'élève au bus
        $query = "UPDATE students SET 
                  bus_id = :bus_id, 
                  bus_group = :bus_group, 
                  route_id = :route_id,
                  payment_status = 'paid'
                  WHERE id = :student_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":bus_id", $data->bus_id);
        $stmt->bindParam(":bus_group", $data->bus_group);
        $stmt->bindParam(":route_id", $payment['route_id']);
        $stmt->bindParam(":student_id", $payment['student_id']);
        $stmt->execute();
        
        // Créer notification pour le tuteur
        $notifId = generateUUID();
        $title = "Paiement validé et bus affecté";
        $message = "Le paiement pour {$payment['first_name']} {$payment['last_name']} a été validé. Bus {$payment['bus_id']}, Groupe {$data->bus_group}.";
        
        $query = "INSERT INTO notifications (id, recipient_id, recipient_type, type, title, message, sender_type) 
                  VALUES (:id, :recipient_id, 'tutor', 'payment', :title, :message, 'admin')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $notifId);
        $stmt->bindParam(":recipient_id", $payment['tutor_id']);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":message", $message);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(200, "Paiement validé et élève affecté au bus");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}
?>