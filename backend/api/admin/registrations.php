<?php

// ============================================
// 6. api/admin/registrations.php
// ============================================
function getRegistrations() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    try {
        $query = "SELECT * FROM v_students_complete WHERE status = 'pending' ORDER BY created_at DESC";
        $stmt = $db->query($query);
        $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse(200, "Inscriptions récupérées", $registrations);
    } catch (Exception $e) {
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function approveRegistration() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->student_id)) {
        sendResponse(400, "ID élève requis");
    }
    
    try {
        $db->beginTransaction();
        
        // Récupérer les infos de l'élève
        $query = "SELECT * FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->student_id);
        $stmt->execute();
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student) {
            sendResponse(404, "Élève non trouvé");
        }
        
        // Approuver l'inscription
        $query = "UPDATE students SET status = 'approved' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->student_id);
        $stmt->execute();
        
        // Créer le paiement
        $amount = $student['subscription_type'] === 'annuel' ? 3000 : 300;
        $paymentId = generateUUID();
        
        $query = "INSERT INTO payments (id, student_id, tutor_id, amount, transport_type, subscription_type, status) 
                  VALUES (:id, :student_id, :tutor_id, :amount, :transport_type, :subscription_type, 'pending')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $paymentId);
        $stmt->bindParam(":student_id", $data->student_id);
        $stmt->bindParam(":tutor_id", $student['tutor_id']);
        $stmt->bindParam(":amount", $amount);
        $stmt->bindParam(":transport_type", $student['transport_type']);
        $stmt->bindParam(":subscription_type", $student['subscription_type']);
        $stmt->execute();
        
        // Créer notification pour le tuteur
        $notifId = generateUUID();
        $title = "Inscription validée !";
        $message = "L'inscription de {$student['first_name']} {$student['last_name']} a été validée. Veuillez procéder au paiement de {$amount} DH à l'école pour finaliser l'inscription.";
        
        $query = "INSERT INTO notifications (id, recipient_id, recipient_type, type, title, message, sender_type) 
                  VALUES (:id, :recipient_id, 'tutor', 'validation', :title, :message, 'admin')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $notifId);
        $stmt->bindParam(":recipient_id", $student['tutor_id']);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":message", $message);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(200, "Inscription approuvée avec succès");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

function rejectRegistration() {
    include_once '../../config/database.php';
    include_once '../../includes/cors.php';
    include_once '../../includes/functions.php';
    
    setCorsHeaders();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->student_id)) {
        sendResponse(400, "ID élève requis");
    }
    
    try {
        $db->beginTransaction();
        
        // Récupérer les infos de l'élève
        $query = "SELECT * FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->student_id);
        $stmt->execute();
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student) {
            sendResponse(404, "Élève non trouvé");
        }
        
        // Rejeter l'inscription
        $query = "UPDATE students SET status = 'rejected' WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->student_id);
        $stmt->execute();
        
        // Créer notification pour le tuteur
        $notifId = generateUUID();
        $title = "Inscription refusée";
        $message = "L'inscription de {$student['first_name']} {$student['last_name']} a été refusée. Veuillez contacter l'administration.";
        
        $query = "INSERT INTO notifications (id, recipient_id, recipient_type, type, title, message, sender_type) 
                  VALUES (:id, :recipient_id, 'tutor', 'validation', :title, :message, 'admin')";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $notifId);
        $stmt->bindParam(":recipient_id", $student['tutor_id']);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":message", $message);
        $stmt->execute();
        
        $db->commit();
        
        sendResponse(200, "Inscription refusée");
        
    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(500, "Erreur: " . $e->getMessage());
    }
}

?>