<?php
// supervisor_students.php - Gestion des élèves du superviseur
require_once 'config.php';

// GET - Récupérer la liste des élèves
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_GET['supervisor_id'])) {
        sendError('ID du superviseur requis');
    }

    $supervisorId = $_GET['supervisor_id'];

    try {
        // Récupérer le bus du superviseur
        $stmt = $pdo->prepare("
            SELECT id, bus_id FROM buses WHERE supervisor_id = :supervisor_id LIMIT 1
        ");
        $stmt->execute(['supervisor_id' => $supervisorId]);
        $bus = $stmt->fetch();

        if (!$bus) {
            sendResponse(['students' => [], 'bus' => null]);
            exit;
        }

        // Récupérer tous les élèves approuvés du bus
        $stmt = $pdo->prepare("
            SELECT 
                s.id,
                s.first_name as firstName,
                s.last_name as lastName,
                s.class,
                s.age,
                s.gender,
                s.zone as quarter,
                s.transport_type as transportType,
                s.subscription_type as subscriptionType,
                s.bus_group as busGroup,
                s.absence_count as absenceCount,
                s.payment_status as paymentStatus,
                s.tutor_id as tutorId,
                ut.phone as tutorPhone,
                CONCAT(ut.first_name, ' ', ut.last_name) as tutorName
            FROM students s
            INNER JOIN tutors t ON s.tutor_id = t.id
            INNER JOIN users ut ON t.user_id = ut.id
            WHERE s.bus_id = :bus_id AND s.status = 'approved'
            ORDER BY s.last_name, s.first_name
        ");
        $stmt->execute(['bus_id' => $bus['id']]);
        $students = $stmt->fetchAll();

        // Convertir les valeurs numériques
        foreach ($students as &$student) {
            $student['age'] = (int)$student['age'];
            $student['absenceCount'] = (int)$student['absenceCount'];
        }

        sendResponse([
            'students' => $students,
            'bus' => [
                'id' => $bus['id'],
                'busId' => $bus['bus_id']
            ]
        ]);

    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la récupération des élèves', 500);
    }
}

// PUT - Mettre à jour un élève
elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['supervisor_id']) || !isset($input['student_id'])) {
        sendError('Données incomplètes');
    }

    try {
        $pdo->beginTransaction();

        // Vérifier que l'élève appartient bien au bus du superviseur
        $stmt = $pdo->prepare("
            SELECT s.id, s.bus_id 
            FROM students s
            INNER JOIN buses b ON s.bus_id = b.id
            WHERE s.id = :student_id AND b.supervisor_id = :supervisor_id
        ");
        $stmt->execute([
            'student_id' => $input['student_id'],
            'supervisor_id' => $input['supervisor_id']
        ]);

        if (!$stmt->fetch()) {
            sendError('Élève non autorisé', 403);
        }

        // Préparer les champs à mettre à jour
        $updates = [];
        $params = ['student_id' => $input['student_id']];

        if (isset($input['firstName'])) {
            $updates[] = "first_name = :firstName";
            $params['firstName'] = $input['firstName'];
        }
        if (isset($input['lastName'])) {
            $updates[] = "last_name = :lastName";
            $params['lastName'] = $input['lastName'];
        }
        if (isset($input['class'])) {
            $updates[] = "class = :class";
            $params['class'] = $input['class'];
        }
        if (isset($input['quarter'])) {
            $updates[] = "zone = :quarter";
            $params['quarter'] = $input['quarter'];
        }
        if (isset($input['busGroup'])) {
            $updates[] = "bus_group = :busGroup";
            $params['busGroup'] = $input['busGroup'];
        }

        if (empty($updates)) {
            sendError('Aucune donnée à mettre à jour');
        }

        // Mettre à jour l'élève
        $sql = "UPDATE students SET " . implode(', ', $updates) . " WHERE id = :student_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $pdo->commit();

        sendResponse([
            'success' => true,
            'message' => 'Élève mis à jour avec succès'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Database error: ' . $e->getMessage());
        sendError('Erreur lors de la mise à jour', 500);
    }
}

else {
    sendError('Méthode non autorisée', 405);
}
?>