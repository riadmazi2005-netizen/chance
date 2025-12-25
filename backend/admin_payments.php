<?php
// admin_payments.php - Gestion des paiements et affectation des bus
require_once 'config.php';

// GET - Récupérer tous les paiements
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                p.id,
                p.student_id as studentId,
                p.tutor_id as tutorId,
                p.amount,
                p.discount_percentage as discountPercentage,
                p.discount_amount as discountAmount,
                p.final_amount as finalAmount,
                p.transport_type as transportType,
                p.subscription_type as subscriptionType,
                p.status,
                p.payment_date as paymentDate,
                p.created_at as createdAt,
                s.first_name as studentFirstName,
                s.last_name as studentLastName,
                s.class as studentClass,
                ut.first_name as tutorFirstName,
                ut.last_name as tutorLastName
            FROM payments p
            INNER JOIN students s ON p.student_id = s.id
            INNER JOIN tutors t ON p.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            ORDER BY p.created_at DESC
        ");
        
        $payments = $stmt->fetchAll();

        // Enrichir avec les noms
        foreach ($payments as &$payment) {
            $payment['amount'] = (float)$payment['amount'];
            $payment['discountPercentage'] = (int)$payment['discountPercentage'];
            $payment['discountAmount'] = (float)$payment['discountAmount'];
            $payment['finalAmount'] = (float)$payment['finalAmount'];
            $payment['studentName'] = $payment['studentFirstName'] . ' ' . $payment['studentLastName'];
            $payment['tutorName'] = $payment['tutorFirstName'] . ' ' . $payment['tutorLastName'];
            unset($payment['studentFirstName'], $payment['studentLastName']);
            unset($payment['tutorFirstName'], $payment['tutorLastName']);
        }

        sendResponse(['payments' => $payments]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des paiements', 500);
    }
}

// POST - Valider un paiement et affecter au bus
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['payment_id']) || !isset($input['bus_id']) || !isset($input['bus_group'])) {
        sendError('Données incomplètes (payment_id, bus_id, bus_group requis)');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer les infos du paiement et de l'élève
        $stmt = $pdo->prepare("
            SELECT 
                p.*,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                s.tutor_id,
                b.bus_id as bus_name,
                b.route_id
            FROM payments p
            INNER JOIN students s ON p.student_id = s.id
            INNER JOIN buses b ON b.id = :bus_id
            WHERE p.id = :payment_id
        ");
        $stmt->execute([
            'payment_id' => $input['payment_id'],
            'bus_id' => $input['bus_id']
        ]);
        $payment = $stmt->fetch();

        if (!$payment) {
            sendError('Paiement ou bus non trouvé', 404);
        }

        // Mettre à jour le statut du paiement
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET status = 'paid', payment_date = CURDATE()
            WHERE id = :payment_id
        ");
        $stmt->execute(['payment_id' => $input['payment_id']]);

        // Affecter l'élève au bus avec le groupe
        $stmt = $pdo->prepare("
            UPDATE students 
            SET bus_id = :bus_id, 
                bus_group = :bus_group,
                route_id = :route_id,
                payment_status = 'paid'
            WHERE id = :student_id
        ");
        $stmt->execute([
            'bus_id' => $input['bus_id'],
            'bus_group' => $input['bus_group'],
            'route_id' => $payment['route_id'],
            'student_id' => $payment['student_id']
        ]);

        // Notifier le tuteur
        $notifId = generateUUID();
        $groupText = $input['bus_group'] === 'A' ? 'Groupe A (07h00-07h30 / 16h30-17h00)' : 'Groupe B (07h30-08h00 / 17h30-18h00)';
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (
                id, recipient_id, recipient_type, sender_type,
                type, title, message
            ) VALUES (
                :id, :recipient_id, 'tutor', 'admin',
                'payment', :title, :message
            )
        ");
        $stmt->execute([
            'id' => $notifId,
            'recipient_id' => $payment['tutor_id'],
            'title' => 'Paiement validé et bus affecté',
            'message' => "Le paiement pour {$payment['student_first_name']} {$payment['student_last_name']} a été validé. Bus {$payment['bus_name']}, {$groupText}."
        ]);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => 'Paiement validé et élève affecté au bus'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la validation', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>