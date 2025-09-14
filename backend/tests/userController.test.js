const { getAllUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/userController');

describe('UserController', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      session: { user: { id: 1, role: 'admin' } }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    // Reset database mock
    global.mockPool.execute.mockReset();
  });

  describe('getAllUsers', () => {
    test('should return paginated users list', async () => {
      // Mock database responses
      global.mockPool.execute
        .mockResolvedValueOnce([[{ total: 5 }]]) // Count query
        .mockResolvedValueOnce([[
          {
            id: 1,
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user',
            is_active: true,
            created_at: new Date()
          }
        ]]); // Users query

      mockReq.query = { page: 1, limit: 10 };

      await getAllUsers(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        users: expect.arrayContaining([
          expect.objectContaining({
            username: 'testuser',
            name: 'Test User'
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1
        }
      });
    });

    test('should handle search parameter', async () => {
      global.mockPool.execute
        .mockResolvedValueOnce([[{ total: 1 }]])
        .mockResolvedValueOnce([[{
          id: 1,
          username: 'searchuser',
          name: 'Search User',
          email: 'search@example.com'
        }]]);

      mockReq.query = { search: 'search', page: 1, limit: 10 };

      await getAllUsers(mockReq, mockRes);

      expect(global.mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('(username LIKE ? OR name LIKE ? OR company LIKE ?)'),
        expect.arrayContaining(['%search%', '%search%', '%search%', 10, 0])
      );
    });

    test('should handle database error', async () => {
      global.mockPool.execute.mockRejectedValueOnce(new Error('Database error'));

      await getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: '사용자 목록 조회 중 오류가 발생했습니다.'
      });
    });
  });

  describe('getUser', () => {
    test('should return single user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      };

      global.mockPool.execute.mockResolvedValueOnce([[mockUser]]);
      mockReq.params.id = '1';

      await getUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ user: mockUser });
    });

    test('should return 404 for non-existent user', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.id = '999';

      await getUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    });
  });

  describe('createUser', () => {
    test('should create new user successfully', async () => {
      global.mockPool.execute
        .mockResolvedValueOnce([[]]) // Check existing user
        .mockResolvedValueOnce([{ insertId: 123 }]) // Create user
        .mockResolvedValueOnce(); // Log activity

      mockReq.body = {
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com'
      };

      await createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: '사용자가 성공적으로 생성되었습니다.',
        userId: 123
      });
    });

    test('should reject duplicate username', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[{ id: 1 }]]); // Existing user found

      mockReq.body = {
        username: 'existinguser',
        password: 'password123',
        name: 'Test User'
      };

      await createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '이미 존재하는 사용자명입니다.'
      });
    });

    test('should validate required fields', async () => {
      mockReq.body = {
        username: 'testuser'
        // Missing password and name
      };

      await createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '사용자명, 비밀번호, 이름은 필수입니다.'
      });
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      const existingUser = {
        id: 1,
        username: 'testuser',
        name: 'Old Name'
      };

      global.mockPool.execute
        .mockResolvedValueOnce([[existingUser]]) // Find user
        .mockResolvedValueOnce() // Update user
        .mockResolvedValueOnce(); // Log activity

      mockReq.params.id = '1';
      mockReq.body = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      await updateUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: '사용자 정보가 성공적으로 업데이트되었습니다.'
      });
    });

    test('should return 404 for non-existent user', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.id = '999';

      await updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: '사용자를 찾을 수 없습니다.'
      });
    });

    test('should handle no fields to update', async () => {
      const existingUser = { id: 1, username: 'testuser' };
      global.mockPool.execute.mockResolvedValueOnce([[existingUser]]);

      mockReq.params.id = '1';
      mockReq.body = {}; // No fields to update

      await updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '업데이트할 필드가 없습니다.'
      });
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      global.mockPool.execute
        .mockResolvedValueOnce([[{ username: 'testuser' }]]) // Find user
        .mockResolvedValueOnce() // Delete user
        .mockResolvedValueOnce(); // Log activity

      mockReq.params.id = '2'; // Different from session user id
      mockReq.session.user.id = 1;

      await deleteUser(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: '사용자가 성공적으로 삭제되었습니다.'
      });
    });

    test('should prevent self-deletion', async () => {
      mockReq.params.id = '1';
      mockReq.session.user.id = 1;

      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: '자기 자신은 삭제할 수 없습니다.'
      });
    });

    test('should return 404 for non-existent user', async () => {
      global.mockPool.execute.mockResolvedValueOnce([[]]);
      mockReq.params.id = '999';

      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });
});