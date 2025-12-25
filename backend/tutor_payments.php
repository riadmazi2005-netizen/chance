<?php
// tutor_payments.php - Gestion des paiements du tuteur
require_once 'config.php';

// GET - Récupérer les paiements
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['tutor_id'])) {
        sendError('ID du tuteur requis');
    }

    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.id,
                p.student_id as studentId,
                p.amount,
                p.discount_percentage as discountPercentage,
                p.discount_amount as discountAmount,
                p.final_amount as finalAmount,
                p.transport_type as transportType,
                p.subscription_type as subscriptionType,
                p.status,
                p.verification_code as verificationCode,
                p.payment_date as paymentDate,
                p.created_at as createdAt,
                s.first_name as studentFirstName,
                s.last_name as studentLastName,
                s.class as studentClass
            FROM payments p
            INNER JOIN students s ON p.student_id = s.id
            WHERE p.tutor_id = :tutor_id
            ORDER BY p.created_at DESC
        ");
        
        $stmt->execute(['tutor_id' => $_GET['tutor_id']]);
        $payments = $stmt->fetchAll();

        // Enrichir avec les noms et convertir les types
        foreach ($payments as &$payment) {
            $payment['amount'] = (float)$payment['amount'];
            $payment['discountPercentage'] = (int)$payment['discountPercentage'];
            $payment['discountAmount'] = (float)$payment['discountAmount'];
            $payment['finalAmount'] = (float)$payment['finalAmount'];
            $payment['studentName'] = $payment['studentFirstName'] . ' ' . $payment['studentLastName'];
            unset($payment['studentFirstName'], $payment['studentLastName']);
        }

        sendResponse(['payments' => $payments]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des paiements', 500);
    }
}

// POST - Créer une nouvelle demande de paiement (effectué par l'admin normalement)
// Ce endpoint est pour information, le paiement est créé automatiquement lors de l'approbation

else {
    sendError('Méthode non autorisée', 405);
}
?>