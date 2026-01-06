-- phpMyAdmin SQL Dump
-- version 5.1.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 06, 2026 at 03:39 PM
-- Server version: 10.4.24-MariaDB
-- PHP Version: 7.4.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fwd`
--

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `client_id` int(11) NOT NULL,
  `client_name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`client_id`, `client_name`) VALUES
(1, 'Retail H'),
(2, 'FSFS'),
(3, 'WPS'),
(4, 'CSM'),
(5, 'Trillium'),
(6, 'Smart FS'),
(7, 'RKB'),
(8, 'MCS'),
(9, 'KFM'),
(10, 'Freshco'),
(11, 'CS Hudson'),
(12, 'CRS'),
(13, 'CDM');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `file_id` int(11) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `notes`
--

CREATE TABLE `notes` (
  `note_id` int(11) NOT NULL,
  `work_order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `note_text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'admin'),
(2, 'dispatcher'),
(3, 'team_leader');

-- --------------------------------------------------------

--
-- Table structure for table `stores`
--

CREATE TABLE `stores` (
  `store_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `store_name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `stores`
--

INSERT INTO `stores` (`store_id`, `client_id`, `store_name`) VALUES
(1, 1, 'Marshalls'),
(2, 1, 'Pottery Barn'),
(3, 2, 'TJ Maxx'),
(4, 2, 'Bath and Body Works'),
(5, 3, 'Office Max'),
(6, 3, 'Office Depot'),
(7, 4, 'Tractor Supply'),
(8, 4, 'Home Goods'),
(9, 1, 'Amedisys Home Health'),
(10, 2, 'Claire\'s'),
(11, 7, 'Creative Playrooms'),
(12, 8, 'DOLAR TREE'),
(13, 2, 'Eyemart Express'),
(14, 11, 'Jack Williams'),
(15, 7, 'JCrew'),
(16, 5, 'Le Creuset'),
(17, 2, 'Michaels'),
(18, 10, 'NIKE'),
(19, 7, 'Octapharma Plasma'),
(20, 5, 'Optum Serve'),
(21, 12, 'Petco'),
(22, 4, 'Potbelly Sandwich Works'),
(23, 11, 'Ross Dress For Less'),
(24, 2, 'Target'),
(25, 7, 'The Village Learning Center'),
(26, 4, 'Tractor Supply');

-- --------------------------------------------------------

--
-- Table structure for table `technicians`
--

CREATE TABLE `technicians` (
  `technician_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `trade` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `payment_info` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `technicians`
--

INSERT INTO `technicians` (`technician_id`, `full_name`, `trade`, `phone`, `city`, `state`, `payment_info`) VALUES
(1, 'Derek Starkk', 'Handyman', '(518) 401-7864', 'Fort Edward', 'NY', 'Zelle'),
(2, 'Ryan Eckhart', 'Handyman', '(610) 835-3271', 'Palmerton', 'PA', 'Venmo'),
(3, 'Josh Collins', 'Plumber', '(937) 304-2634', 'Dayton', 'OH', 'Cashapp'),
(4, 'Ian Saeli', 'All Trades', '(540) 388-9460', 'Fredericksburg', 'VA', 'Paypal'),
(5, 'Ludwig Lopez', 'Handyman', '(570) 766-1646', 'Scranton', 'PA', 'Zelle'),
(6, 'Ali Tunchenke', 'Plumber', '(617) 314-9587', 'Montgomery', 'AL', 'BankWire'),
(7, 'Aaron Cesene', 'Handyman', '(330) 937-1287', 'Youngstown', 'OH', 'Online Invoice');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `role_id`) VALUES
(1, 'Jimmy Brown', 'jimmy.brown@fwd.com', 'Jimmy123', 3),
(2, 'Mira Tadros', 'mira.tadros@fwd.com', 'Mira123', 1),
(3, 'Nassib Akel', 'nassib.akel@fwd.com', 'Nassib123', 1),
(4, 'Mason Parker', 'mason.parker@fwd.com', 'Mason123', 2),
(5, 'Robert Adams', 'robert.adams@fwd.com', 'Robert123', 2),
(6, 'Raphael Murphy', 'raphael.murphy@fwd.com', 'Raphael123', 2);

-- --------------------------------------------------------

--
-- Table structure for table `work_orders`
--

CREATE TABLE `work_orders` (
  `work_order_id` int(11) NOT NULL,
  `work_order_number` varchar(50) DEFAULT NULL,
  `assigned_dispatcher` int(11) DEFAULT NULL,
  `current_status` enum('Assigned','Secured','Awaiting Approval','Awaiting Advice','Onsite','Job Done','Needs Proposal','Approved Scheduled','Approved Pending','Return Trip Needed','Parts Needed','Parts Ordered','Billed For Incurred','Ready To Invoice','Invoiced','Recall','Paid','Canceled') NOT NULL DEFAULT 'Assigned',
  `nte` decimal(10,2) DEFAULT NULL,
  `eta_date` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `address_line` varchar(255) NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(50) DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `store_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `work_orders`
--

INSERT INTO `work_orders` (`work_order_id`, `work_order_number`, `assigned_dispatcher`, `current_status`, `nte`, `eta_date`, `description`, `address_line`, `city`, `state`, `zip_code`, `store_id`) VALUES
(125434, '3436927', 4, 'Assigned', '650.00', '2026-01-07', 'Rear manual receiving handle has come off and team cannot access the clinic.', '468 CHANCELLOR AVE', 'IRVINGTON', 'NJ', '01777', 9),
(125435, '564081', 4, 'Secured', '175.00', '2026-01-07', 'Damage to the drywall behind the door. Need to patch & paint.', '61 RHL Boulevard', 'Charleston', 'WV', '25303', 1),
(125436, '1257827', 4, 'Needs Proposal', '162.50', '2026-01-06', 'Backflow preventer is leaking. It is splashing and spilling from its containment area.', '24630 dulles landing dr', 'Dulles', 'VA', '20189', 17),
(125438, '323456', 5, 'Onsite', '165.56', '2026-01-10', 'Toilet is clogged and overflowing. Please snake the fixture.', '406 Abraham Ave', 'Toledo', 'OH', '32654', 14),
(125439, '65151', 6, 'Assigned', '125.00', '2026-01-10', 'Drains Overflowing. Please jet the line.', '106 West Chester Ave', 'Saugus', 'MA', '01906', 16),
(125440, '31247', 5, 'Canceled', '540.00', '2026-01-01', 'Automatic Door not opening and closing as intended. Please inspect.', '405 Lubljana Street', 'Maumee', 'OH', '31232', 5);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`client_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `work_order_id` (`work_order_id`);

--
-- Indexes for table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`note_id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `technicians`
--
ALTER TABLE `technicians`
  ADD PRIMARY KEY (`technician_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD PRIMARY KEY (`work_order_id`),
  ADD KEY `assigned_dispatcher` (`assigned_dispatcher`),
  ADD KEY `fk_work_orders_store` (`store_id`),
  ADD KEY `idx_work_orders_number` (`work_order_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `client_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notes`
--
ALTER TABLE `notes`
  MODIFY `note_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stores`
--
ALTER TABLE `stores`
  MODIFY `store_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `technicians`
--
ALTER TABLE `technicians`
  MODIFY `technician_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `work_orders`
--
ALTER TABLE `work_orders`
  MODIFY `work_order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125441;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`work_order_id`);

--
-- Constraints for table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`work_order_id`),
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `stores`
--
ALTER TABLE `stores`
  ADD CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`client_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);

--
-- Constraints for table `work_orders`
--
ALTER TABLE `work_orders`
  ADD CONSTRAINT `fk_work_orders_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`),
  ADD CONSTRAINT `work_orders_ibfk_2` FOREIGN KEY (`assigned_dispatcher`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
