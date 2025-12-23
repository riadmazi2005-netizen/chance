// Mock data service for local development
const STORAGE_PREFIX = 'schoolbus_';

// Initialize mock data if not exists
const initializeMockData = () => {
  if (!localStorage.getItem(`${STORAGE_PREFIX}initialized`)) {
    // Default admin
    localStorage.setItem(`${STORAGE_PREFIX}admins`, JSON.stringify([
      {
        id: 'admin1',
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrateur Principal'
      }
    ]));

    // Sample drivers
    localStorage.setItem(`${STORAGE_PREFIX}drivers`, JSON.stringify([
      {
        id: 'driver1',
        firstName: 'Ahmed',
        lastName: 'Bennani',
        cin: 'AB123456',
        phone: '0612345678',
        email: 'ahmed@example.com',
        licenseNumber: 'L123456',
        age: 35,
        salary: 5000,
        password: 'driver123',
        status: 'active'
      }
    ]));

    // Sample supervisors
    localStorage.setItem(`${STORAGE_PREFIX}supervisors`, JSON.stringify([
      {
        id: 'supervisor1',
        firstName: 'Fatima',
        lastName: 'Zahra',
        phone: '0623456789',
        email: 'fatima@example.com',
        salary: 4000,
        password: 'supervisor123'
      }
    ]));

    // Sample tutors
    localStorage.setItem(`${STORAGE_PREFIX}tutors`, JSON.stringify([
      {
        id: 'tutor1',
        firstName: 'Mohamed',
        lastName: 'Alami',
        email: 'mohamed@example.com',
        phone: '0634567890',
        cin: 'CD789012',
        address: '123 Rue Hassan II, Casablanca',
        password: 'tutor123'
      }
    ]));

    // Sample routes
    localStorage.setItem(`${STORAGE_PREFIX}routes`, JSON.stringify([
      {
        id: 'route1',
        routeId: 'Trajet 001',
        departure: 'École Mohammed V',
        terminus: 'Hay Riad',
        departureTimeMorning: '07:00',
        arrivalTimeMorning: '07:30',
        departureTimeEvening: '16:30',
        arrivalTimeEvening: '17:00'
      }
    ]));

    // Sample buses
    localStorage.setItem(`${STORAGE_PREFIX}buses`, JSON.stringify([
      {
        id: 'bus1',
        busId: 'Bus 001',
        matricule: '12345-A-1',
        capacity: 30,
        driverId: 'driver1',
        supervisorId: 'supervisor1',
        routeId: 'route1',
        status: 'en_service'
      }
    ]));

    // Sample students
    localStorage.setItem(`${STORAGE_PREFIX}students`, JSON.stringify([
      {
        id: 'student1',
        firstName: 'Youssef',
        lastName: 'Tahiri',
        class: '5AP',
        age: 10,
        gender: 'male',
        address: '456 Avenue Mohammed VI',
        quarter: 'Hay Riad',
        transportType: 'aller-retour',
        subscriptionType: 'mensuel',
        parentRelation: 'Père',
        tutorId: 'tutor1',
        busId: 'bus1',
        busGroup: 'A',
        status: 'approved',
        paymentStatus: 'paid',
        absenceCount: 0,
        routeId: 'route1'
      }
    ]));

    // Sample accidents
    localStorage.setItem(`${STORAGE_PREFIX}accidents`, JSON.stringify([]));

    // Sample notifications
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify([]));

    // Sample payments
    localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify([]));

    // Sample raise requests
    localStorage.setItem(`${STORAGE_PREFIX}raiseRequests`, JSON.stringify([]));

    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
};

// Generic CRUD operations
const getEntity = (entityName) => {
  initializeMockData();
  const data = localStorage.getItem(`${STORAGE_PREFIX}${entityName}`);
  return data ? JSON.parse(data) : [];
};

const saveEntity = (entityName, data) => {
  localStorage.setItem(`${STORAGE_PREFIX}${entityName}`, JSON.stringify(data));
};

const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Mock API
export const mockApi = {
  entities: {
    Admin: {
      list: async () => getEntity('admins'),
      create: async (data) => {
        const entities = getEntity('admins');
        const newEntity = { ...data, id: generateId() };
        entities.push(newEntity);
        saveEntity('admins', entities);
        return newEntity;
      }
    },
    Driver: {
      list: async () => getEntity('drivers'),
      filter: async (criteria) => {
        const entities = getEntity('drivers');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      },
      update: async (id, data) => {
        const entities = getEntity('drivers');
        const index = entities.findIndex(e => e.id === id);
        if (index !== -1) {
          entities[index] = { ...entities[index], ...data };
          saveEntity('drivers', entities);
          return entities[index];
        }
        return null;
      }
    },
    Supervisor: {
      list: async () => getEntity('supervisors'),
      filter: async (criteria) => {
        const entities = getEntity('supervisors');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      }
    },
    Tutor: {
      list: async () => getEntity('tutors'),
      filter: async (criteria) => {
        const entities = getEntity('tutors');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      },
      update: async (id, data) => {
        const entities = getEntity('tutors');
        const index = entities.findIndex(e => e.id === id);
        if (index !== -1) {
          entities[index] = { ...entities[index], ...data };
          saveEntity('tutors', entities);
          return entities[index];
        }
        return null;
      }
    },
    Bus: {
      list: async () => getEntity('buses'),
      filter: async (criteria) => {
        const entities = getEntity('buses');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      }
    },
    Route: {
      list: async () => getEntity('routes')
    },
    Student: {
      list: async () => getEntity('students'),
      filter: async (criteria) => {
        const entities = getEntity('students');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      },
      create: async (data) => {
        const entities = getEntity('students');
        const newEntity = { ...data, id: generateId(), created_date: new Date().toISOString() };
        entities.push(newEntity);
        saveEntity('students', entities);
        return newEntity;
      },
      update: async (id, data) => {
        const entities = getEntity('students');
        const index = entities.findIndex(e => e.id === id);
        if (index !== -1) {
          entities[index] = { ...entities[index], ...data };
          saveEntity('students', entities);
          return entities[index];
        }
        return null;
      }
    },
    Accident: {
      list: async () => getEntity('accidents'),
      filter: async (criteria) => {
        const entities = getEntity('accidents');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      }
    },
    Notification: {
      list: async () => getEntity('notifications'),
      filter: async (criteria) => {
        const entities = getEntity('notifications');
        return entities.filter(e => {
          return Object.keys(criteria).every(key => e[key] === criteria[key]);
        });
      },
      create: async (data) => {
        const entities = getEntity('notifications');
        const newEntity = { 
          ...data, 
          id: generateId(), 
          created_date: new Date().toISOString(),
          read: false
        };
        entities.push(newEntity);
        saveEntity('notifications', entities);
        return newEntity;
      },
      update: async (id, data) => {
        const entities = getEntity('notifications');
        const index = entities.findIndex(e => e.id === id);
        if (index !== -1) {
          entities[index] = { ...entities[index], ...data };
          saveEntity('notifications', entities);
          return entities[index];
        }
        return null;
      }
    },
    Payment: {
      list: async () => getEntity('payments'),
      create: async (data) => {
        const entities = getEntity('payments');
        const newEntity = { ...data, id: generateId(), created_date: new Date().toISOString() };
        entities.push(newEntity);
        saveEntity('payments', entities);
        return newEntity;
      }
    },
    RaiseRequest: {
      create: async (data) => {
        const entities = getEntity('raiseRequests');
        const newEntity = { ...data, id: generateId(), created_date: new Date().toISOString() };
        entities.push(newEntity);
        saveEntity('raiseRequests', entities);
        return newEntity;
      }
    }
  }
};

// Initialize on import
initializeMockData();