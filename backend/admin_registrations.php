<?php
// admin_registrations.php - Gestion des demandes d'inscription
require_once 'config.php';

// GET - Récupérer les demandes en attente
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT 
                s.id,
                s.first_name as firstName,
                s.last_name as lastName,
                s.class,
                s.age,
                s.gender,
                s.zone as quarter,
                s.parent_relation as parentRelation,
                s.transport_type as transportType,
                s.subscription_type as subscriptionType,
                s.tutor_id as tutorId,
                ut.phone as tutorPhone,
                CONCAT(ut.first_name, ' ', ut.last_name) as tutorName,
                s.created_at as createdAt
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.status = 'pending'
            ORDER BY s.created_at ASC
        ");
        
        $students = $stmt->fetchAll();

        // Convertir les valeurs
        foreach ($students as &$student) {
            $student['age'] = (int)$student['age'];
        }

        sendResponse(['students' => $students]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des demandes', 500);
    }
}

// POST - Approuver une inscription
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['student_id']) || !isset($input['action'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Récupérer les infos de l'élève
        $stmt = $pdo->prepare("
            SELECT 
                s.*,
                ut.first_name as tutor_first_name,
                ut.last_name as tutor_last_name
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.id = :student_id
        ");
        $stmt->execute(['student_id' => $input['student_id']]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Élève non trouvé', 404);
        }

        if ($input['action'] === 'approve') {
            // Mettre à jour le statut à approved (SANS affecter le bus)
            $stmt = $pdo->prepare("
                UPDATE students 
                SET status = 'approved'
                WHERE id = :student_id
            ");
            $stmt->execute(['student_id' => $input['student_id']]);

            // Calculer le montant du paiement
            $amount = $student['subscription_type'] === 'annuel' ? 3000 : 300;
            $finalAmount = $amount; // Pas de réduction pour le moment

            // Créer un enregistrement de paiement
            $paymentId = generateUUID();
            $stmt = $pdo->prepare("
                INSERT INTO payments (
                    id, student_id, tutor_id, amount, discount_percentage,
                    discount_amount, final_amount, transport_type, 
                    subscription_type, status
                ) VALUES (
                    :id, :student_id, :tutor_id, :amount, 0,
                    0, :final_amount, :transport_type,
                    :subscription_type, 'pending'
                )
            ");
            $stmt->execute([
                'id' => $paymentId,
                'student_id' => $input['student_id'],
                'tutor_id' => $student['tutor_id'],
                'amount' => $amount,
                'final_amount' => $finalAmount,
                'transport_type' => $student['transport_type'],
                'subscription_type' => $student['subscription_type']
            ]);

            // Notifier le tuteur
            $notifId = generateUUID();
            $stmt = $pdo->prepare("
                INSERT INTO notifications (
                    id, recipient_id, recipient_type, sender_type,
                    type, title, message
                ) VALUES (
                    :id, :recipient_id, 'tutor', 'admin',
                    'validation', :title, :message
                )
            ");
            $stmt->execute([
                'id' => $notifId,
                'recipient_id' => $student['tutor_id'],
                'title' => 'Inscription validée !',
                'message' => "L'inscription de {$student['first_name']} {$student['last_name']} a été validée. Veuillez procéder au paiement de {$amount} DH à l'école pour finaliser l'inscription."
            ]);

            $message = 'Inscription approuvée avec succès';

        } elseif ($input['action'] === 'reject') {
            // Mettre à jour le statut à rejected
            $stmt = $pdo->prepare("
                UPDATE students 
                SET status = 'rejected'
                WHERE id = :student_id
            ");
            $stmt->execute(['student_id' => $input['student_id']]);

            // Notifier le tuteur
            $notifId = generateUUID();
            $stmt = $pdo->prepare("
                INSERT INTO notifications (
                    id, recipient_id, recipient_type, sender_type,
                    type, title, message
                ) VALUES (
                    :id, :recipient_id, 'tutor', 'admin',
                    'validation', :title, :message
                )
            ");
            $stmt->execute([
                'id' => $notifId,
                'recipient_id' => $student['tutor_id'],
                'title' => 'Inscription refusée',
                'message' => "L'inscription de {$student['first_name']} {$student['last_name']} a été refusée. Veuillez contacter l'administration."
            ]);

            $message = 'Inscription refusée';

        } else {
            sendError('Action invalide');
        }

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => $message
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors du traitement', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>