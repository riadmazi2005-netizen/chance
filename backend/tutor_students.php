<?php
// tutor_students.php - Gestion des enfants du tuteur
require_once 'config.php';

// GET - Récupérer les enfants du tuteur
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['tutor_id'])) {
        sendError('ID du tuteur requis');
    }

    try {
        $stmt = $pdo->prepare("
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
                s.bus_group as busGroup,
                s.absence_count as absenceCount,
                s.payment_status as paymentStatus,
                s.status,
                s.created_at as createdAt,
                b.bus_id as busName,
                r.terminus as routeName
            FROM students s
            LEFT JOIN buses b ON s.bus_id = b.id
            LEFT JOIN routes r ON s.route_id = r.id
            WHERE s.tutor_id = :tutor_id
            ORDER BY s.created_at DESC
        ");
        
        $stmt->execute(['tutor_id' => $_GET['tutor_id']]);
        $students = $stmt->fetchAll();

        // Convertir les valeurs
        foreach ($students as &$student) {
            $student['age'] = (int)$student['age'];
            $student['absenceCount'] = (int)$student['absenceCount'];
        }

        sendResponse(['students' => $students]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération', 500);
    }
}

// POST - Inscrire un nouvel enfant
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['tutorId', 'firstName', 'lastName', 'class', 'age', 'gender', 
                 'quarter', 'parentRelation', 'transportType', 'subscriptionType'];
    
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            sendError("Le champ $field est requis");
        }
    }

    try {
        $studentId = generateUUID();
        
        $stmt = $pdo->prepare("
            INSERT INTO students (
                id, tutor_id, first_name, last_name, class, age, gender,
                zone, parent_relation, transport_type, subscription_type,
                status, payment_status, absence_count
            ) VALUES (
                :id, :tutor_id, :first_name, :last_name, :class, :age, :gender,
                :zone, :parent_relation, :transport_type, :subscription_type,
                'pending', 'unpaid', 0
            )
        ");

        $stmt->execute([
            'id' => $studentId,
            'tutor_id' => $input['tutorId'],
            'first_name' => $input['firstName'],
            'last_name' => $input['lastName'],
            'class' => $input['class'],
            'age' => (int)$input['age'],
            'gender' => $input['gender'],
            'zone' => $input['quarter'],
            'parent_relation' => $input['parentRelation'],
            'transport_type' => $input['transportType'],
            'subscription_type' => $input['subscriptionType']
        ]);

        sendResponse([
            'success' => true,
            'studentId' => $studentId,
            'message' => 'Demande d\'inscription envoyée avec succès'
        ], 201);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de l\'inscription', 500);
    }
}

// DELETE - Supprimer une demande (seulement si pending)
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['student_id']) || !isset($_GET['tutor_id'])) {
        sendError('ID élève et tuteur requis');
    }

    try {
        // Vérifier que l'élève appartient au tuteur et est en statut pending
        $stmt = $pdo->prepare("
            SELECT status FROM students 
            WHERE id = :student_id AND tutor_id = :tutor_id
        ");
        $stmt->execute([
            'student_id' => $_GET['student_id'],
            'tutor_id' => $_GET['tutor_id']
        ]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Élève non trouvé', 404);
        }

        if ($student['status'] !== 'pending') {
            sendError('Impossible de supprimer une inscription déjà traitée');
        }

        // Supprimer l'élève
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = :student_id");
        $stmt->execute(['student_id' => $_GET['student_id']]);

        sendResponse([
            'success' => true,
            'message' => 'Demande supprimée avec succès'
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la suppression', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>