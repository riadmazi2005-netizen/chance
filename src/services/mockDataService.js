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

    localStorage.setItem(`${STORAGE_PREFIX}accidents`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}notifications`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}payments`, JSON.stringify([]));
    localStorage.setItem(`${STORAGE_PREFIX}raiseRequests`, JSON.stringify([]));

    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
  }
};

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

// Create base CRUD methods
const createEntityMethods = (entityName) => ({
  list: async () => getEntity(entityName),
  filter: async (criteria) => {
    const entities = getEntity(entityName);
    return entities.filter(e => {
      return Object.keys(criteria).every(key => e[key] === criteria[key]);
    });
  },
  create: async (data) => {
    const entities = getEntity(entityName);
    const newEntity = { ...data, id: generateId(), created_date: new Date().toISOString() };
    entities.push(newEntity);
    saveEntity(entityName, entities);
    return newEntity;
  },
  update: async (id, data) => {
    const entities = getEntity(entityName);
    const index = entities.findIndex(e => e.id === id);
    if (index !== -1) {
      entities[index] = { ...entities[index], ...data };
      saveEntity(entityName, entities);
      return entities[index];
    }
    return null;
  },
  delete: async (id) => {
    const entities = getEntity(entityName);
    const filtered = entities.filter(e => e.id !== id);
    saveEntity(entityName, filtered);
    return { deleted: true, id };
  }
});

// Create the API object
const apiObject = {
  entities: {
    Admin: createEntityMethods('admins'),
    Driver: createEntityMethods('drivers'),
    Supervisor: createEntityMethods('supervisors'),
    Tutor: createEntityMethods('tutors'),
    Bus: createEntityMethods('buses'),
    Route: createEntityMethods('routes'),
    Student: createEntityMethods('students'),
    Accident: createEntityMethods('accidents'),
    Notification: {
      ...createEntityMethods('notifications'),
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
      }
    },
    Payment: createEntityMethods('payments'),
    RaiseRequest: createEntityMethods('raiseRequests')
  }
};

// Export with multiple names for compatibility
export const mockData = apiObject;
export const mockApi = apiObject;
export default apiObject;

// Initialize on import
initializeMockData();