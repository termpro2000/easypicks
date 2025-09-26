# Expo App Database Tables Investigation

## 📋 Database Tables for User Information and Login Data

### **1. Users Table (Primary User Account Table)**

**Table Name:** `users`

**Purpose:** Stores all user account information and authentication data

**Columns:**
- `id` (Primary Key) - Auto-incrementing integer
- `username` - Unique login identifier (string)
- `password` - Encrypted password (string)
- `name` - Display name (string)
- `email` - Email address (optional)
- `phone` - Phone number (optional)
- `company` - Company/organization name (optional)
- `role` - User role (`admin`, `manager`, `user`, `driver`)
- `is_active` - Account status (boolean)
- `last_login` - Last login timestamp
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `default_sender_address` - Default sending address (optional)
- `default_sender_detail_address` - Detailed address (optional)
- `default_sender_zipcode` - ZIP/postal code (optional)

**User Roles System:**
- `admin` - System administrators with full access
- `manager` - Middle management with elevated permissions
- `user` - Regular users (partner companies)
- `driver` - Delivery drivers with specialized access

### **2. Drivers Table**

**Table Name:** `drivers`

**Purpose:** Stores delivery driver-specific information

**Columns:**
- `id` (Primary Key) - Auto-incrementing integer
- `user_id` - Foreign key reference to users table
- `name` - Driver's name
- `phone` - Contact phone number
- `email` - Email address
- `vehicle_type` - Type of delivery vehicle
- `vehicle_number` - Vehicle license plate number
- `cargo_capacity` - Maximum cargo weight/volume capacity
- `delivery_area` - Geographic delivery coverage area
- `created_at` - Registration timestamp

### **3. Deliveries Table**

**Table Name:** `deliveries`

**Purpose:** Main delivery/shipping orders table with comprehensive delivery information

**Basic Information Fields:**
- `id` (Primary Key)
- `tracking_number` - Unique tracking identifier
- `sender_name` - Sender's name
- `sender_address` - Pickup address
- `customer_name` - Recipient's name
- `customer_phone` - Recipient's phone
- `customer_address` - Delivery address
- `weight` - Package weight
- `status` - Delivery status
- `driver_id` - Assigned driver (Foreign Key)
- `created_at` / `updated_at` - Timestamps

**Extended Delivery Fields:**
- `delivery_type` - Type of delivery service
- `visit_date` - Scheduled visit date
- `visit_time` - Scheduled time
- `construction_type` - Assembly/installation type
- `furniture_company` - Furniture manufacturer
- `main_memo` - Primary delivery notes
- `emergency_contact` - Emergency contact number
- `building_type` - Type of building (apartment, house, etc.)
- `floor_number` - Floor level
- `has_elevator` - Elevator availability
- `needs_ladder_truck` - Specialized equipment needs
- `disposal_required` - Old furniture disposal
- `room_movement` - Inter-room movement required
- `wall_installation` - Wall mounting required
- `product_name` - Product description
- `product_code` - Product identifier
- `product_weight` - Product weight
- `product_size` - Product dimensions
- `box_size` - Packaging dimensions
- `furniture_requests` - Special furniture requests
- `driver_memo` - Driver's notes
- `delivery_fee` - Delivery cost
- `insurance_value` - Insurance coverage amount

### **4. Products Table**

**Table Name:** `products`

**Purpose:** Product catalog and inventory management

**Columns:**
- `id` (Primary Key)
- `name` - Product name
- `code` - Product code
- `maincode` - Main category code
- `subcode` - Subcategory code
- `weight` - Product weight
- `size` - Product dimensions
- `category` - Product category
- `description` - Product description
- `cost1` - Primary cost
- `cost2` - Secondary cost
- `memo` - Additional notes
- `partner_id` - Associated partner company
- `created_at` / `updated_at` - Timestamps

### **5. Product Photos Table**

**Table Name:** `product_photos`

**Purpose:** Store product image references

**Columns:**
- `id` (Primary Key)
- `product_id` - Foreign key to products table
- `photo_url` - Image file path/URL
- `created_at` - Upload timestamp

## 🔐 Authentication & Token Management

### **JWT Token Storage**
- **Storage Location**: Browser's `localStorage` with key `jwt_token`
- **Authentication Type**: JWT-based with Bearer token authorization
- **Features**: Automatic token refresh and validation
- **Fallback**: Session support for backward compatibility

### **Authentication Flow**
1. User submits login credentials via `POST /api/auth/login`
2. Server validates credentials and returns JWT token + user data
3. Token stored in localStorage and included in subsequent API requests
4. User information cached in React context for session management

## 🌐 API Endpoints

### **Authentication Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user information
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/check-username/{username}` - Username availability check

### **User Management Endpoints**
- `GET /api/users` - List all users (with pagination, search, role filtering)
- `GET /api/users/{id}` - Get specific user details
- `POST /api/users` - Create new user account
- `PUT /api/users/{id}` - Update user information
- `DELETE /api/users/{id}` - Delete user account

### **Driver Management Endpoints**
- `GET /api/drivers` - List all drivers
- `POST /api/drivers` - Create new driver
- `PUT /api/drivers/{id}` - Update driver information
- `DELETE /api/drivers/{id}` - Delete driver

### **Schema Information Endpoint**
- `GET /api/schema` - Get complete database schema information

## 🔗 Database Relationships

### **Key Foreign Key Relationships**
- `drivers.user_id` → `users.id` (One driver per user account)
- `deliveries.driver_id` → `drivers.id` (Many deliveries per driver)
- `products.partner_id` → `users.id` (Products belong to partner companies)
- `product_photos.product_id` → `products.id` (Multiple photos per product)

## 🚀 Backend Configuration

### **Production Environment**
- **API Base URL**: `https://efficient-abundance-production-d603.up.railway.app/api`
- **Database Type**: Relational database (MySQL/PostgreSQL)
- **Deployment Platform**: Railway
- **Environment**: Production-ready with auto-scaling

### **Development Environment**
- **Local API**: `http://localhost:3000/api`
- **Frontend Dev Server**: `http://localhost:5173`

## 🔒 Security Features

### **Authentication Security**
- **Password Encryption**: All passwords hashed before database storage
- **JWT Security**: Secure token-based authentication with expiration
- **Role-based Access Control**: Different permission levels by user role
- **Session Management**: Automatic token refresh and validation

### **Data Protection**
- **Input Validation**: Comprehensive validation on client and server
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **Account Management**: Active/inactive account status control
- **Audit Trail**: Created/updated timestamps for all records

## 📊 System Architecture Summary

This comprehensive database structure supports a full-featured delivery management system with:

- **Multi-user Authentication**: Support for admin, manager, user, and driver roles
- **Complete User Management**: Registration, login, profile management
- **Driver Management**: Specialized driver accounts with vehicle information
- **Product Catalog**: Full product database with photos and categories
- **Delivery Tracking**: Comprehensive delivery management with 40+ fields
- **Security**: JWT authentication with role-based access control
- **Scalability**: Production deployment on Railway with auto-scaling

The system is designed to handle multiple user types with appropriate access controls and data segregation for a professional delivery management platform.

---

**Investigation Date**: 2025-01-26  
**Status**: Production Ready  
**Database Schema**: ~40+ fields per delivery, 15+ core user fields