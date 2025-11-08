-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 08, 2025 at 05:13 PM
-- Server version: 10.6.24-MariaDB
-- PHP Version: 8.4.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stefand1_tempo_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `birthDate` date DEFAULT NULL,
  `medical` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `birthDate`, `medical`) VALUES
('adelina2511', 'Adelina Maria Laura Letu', '', '0770706421', '2019-11-25', 'fara alergii, fara medicatie'),
('ahmadi2006', 'Ahmadi Adrin', '', '0757083554', '2021-06-20', ''),
('alex6130', 'Mocanu Alexandru Matei', '', '0723262003', '2016-04-05', 'fara alergii, fara medicatie'),
('amalia8204', 'Amalia Vespan ', '', '0721114504', NULL, 'astm bronsic'),
('ana2107', 'Ana Maria Zamfir', '', '0721055890', '2019-07-21', 'Mentat (5mil), Pantoten (5ml), D3, Omega3'),
('aurora2306', 'Aurora Sophia Alexe', '', '0726206763', '2022-06-23', 'Alergie la fructe de mare'),
('bicheru1507', 'Bicheru Ana Caroline', '', '0722240323', '2021-07-15', 'hiperactivitate bronsica fara tratament'),
('bulea0709', 'Bulea Iacob Mihai', '', '0734774615', '2021-09-07', ''),
('cezar1802', 'Cezar Casian Dinca', 'stefan.dinca07@gmail.com', '0746 060 987', '2021-02-18', 'fara alergii, fara medicatie'),
('clara2109', 'Clara Medeea Postolache', '', '0747559027', '2022-09-21', 'fara alergii, fara medicatie'),
('client1111', 'client test 3', '', '', '2021-11-11', ''),
('colin1110', 'Colin Andrei Dragan', '', '0727065668', '2018-10-11', 'Anafranil'),
('david0609', 'David Samuel Meri', '', '0728083702', '2015-09-06', ''),
('david0610', 'David Marian Burticel', '', '0760397349', '2018-10-06', 'Rispolept, Depakin'),
('denis1298', 'Denis Georgian Mehangief', '', '0729877489', '2020-04-06', 'fara alergii, fara medicatie'),
('dima6571', 'Dima Tudor', '', '0720087456', NULL, ''),
('dolgu6015', 'Dolgu Alex', '', '0743937770', NULL, ''),
('dominic0307', 'Dominic Mihail Georgescu', '', '0733995530', '2019-07-03', 'fara alergii, fara medicatie'),
('eduard3108', 'Eduard Buja', '', '0751214154', '2020-08-31', 'fara alergii, fara medicatie'),
('efremia1701', 'Efremia Niculescu', '', '0723952601', '2021-01-17', 'fara alergii, fara medicatie'),
('eliza9375', 'Eliza Alexandra Dragan', '', '', '2016-02-28', 'Concerta'),
('emilia1207', 'Emilia Ioana Ipate', '', '0723525709', '2022-07-12', 'Alergie lapte de vaca si derivate (posibil)'),
('eric7712', 'Ionita Erick Andrei', '', '0762151857', '2013-01-29', 'Bitinex, Neurovert'),
('eve2345', 'Eve', '', '', NULL, 'fara alergii, fara medicatie'),
('evelin2211', 'Evelin Ioana Matache', '', '0723194433', '2018-11-22', 'fara alergii, fara medicatie'),
('fabi3219', 'Braileanu Fabian Gabriel', '', '0770809855', '2020-04-15', 'fara alergii, fara medicatie'),
('gabriela0307', 'Gabriela Cristiana Maria Cozma', '', '0760325144', '2021-07-03', 'fara alergii, fara medicatie'),
('ionita1509', 'Ionita Matei Andrei ', '', '0768092119', '2020-09-15', ''),
('ionita1904', 'Ionita Marc Alexandru', '', '0768092119', '2022-04-19', 'omega 3, vitamene complex B, Pediakid'),
('irina4275', 'Suteu Iana Florentina Irina', '', '', '2000-06-06', 'fara alergii, fara medicatie'),
('joy4567', 'Copaci Elisabeth Joy', '', '0732731994', NULL, 'Alergii la ro?ii, ananas, prune.\nIntoleranta la gluten si histamina.'),
('maher1110', 'Maher Kadour', '', '0753101004', '2020-10-11', ''),
('maia2903', 'Maia Berghian', '', '0744855763', '2023-03-29', 'fara alergii, fara medicatie'),
('maria1210', 'Maria Ecaterina Lucaci', '', '0723259396', '2021-10-12', 'fara alergii, fara medicatie'),
('matei2709', 'Matei Serban Curelea', '', '0744357422', '2019-09-27', 'fara alergii, fara medicatie'),
('mathias1501', 'Mathias Alexandru Staicu', '', '0786072385', '2020-01-15', 'Vigantol'),
('medeea1611', 'Medeea Ana Gabrielea Anghel', '', '0729844350', '2021-11-16', 'fara alergii, fara medicatie'),
('mirela1357', 'Tone Maria Isabela', '', '0765437340', NULL, 'fara alergii, fara medicatie'),
('mirela1906', 'Mirela Teodora Minu Popa', '', '0735317255', '2016-06-19', 'Bitinex, Rispolet'),
('nectaria0401', 'Nectaria Stefania Rusu', '', '0729939702', '2022-01-04', 'fara alergii, fara medicatie'),
('nichita9876', 'Nichita SEbastian Mihalte', '', '0728875686', NULL, 'fara alergii, fara medicatie'),
('pavel1510', 'Pavel Ilan Croitoru', '', '0747873025', '2021-10-15', 'fara alergii, fara medicatie'),
('petru2012', 'Petru Eric Croitoru', '', '0747873025', '2019-12-20', 'fara alergii, fara medicatie'),
('rami1110', 'Rami Kadour', '', '0753101004', '2020-10-11', 'fara alergii, fara medicatie'),
('rares3005', 'Rares Alexandru Ghita', '', '0732521650', '2018-05-30', 'fara alergii, fara medicatie'),
('robert1812', 'Robert Mark Oliver Timofte', '', '0731794971', '2014-12-18', 'ambrozie'),
('savu1234', 'Savu Rafael', '', '0729644222', NULL, ''),
('selin7002', 'Selin Cosman', '', '0761041864', NULL, 'Tonotil, ulei de peste, omega 3, Cestone'),
('stefan6428', 'Stefan Negru', '', '0767899093', '2019-04-06', 'fara alergii, fara medicatie'),
('teri8813', 'Ionescu Ecaterina ', '', '0724521559', NULL, 'fara alergii, fara medicatie'),
('tom0903', 'Tom Andrei Potecaru', '', '0761752718', '2022-03-09', 'fara alergii, fara medicatie'),
('toma0910', 'Toma Ioan Budulus', '', '0730570097', '2018-10-09', ''),
('toni1505', 'Toni (Antonie-Ioan) Dumitru', '', '', '2020-05-15', 'Rispolept'),
('tudor0107', 'Tudor Condruc', '', '0766763958', '2020-07-01', 'fara alergii, fara medicatie'),
('valentin1611', 'Valentin Alexandru Rimbu', '', '0766104342', '2021-11-16', 'Alergie la nuca de cocos!'),
('vic1589', 'Victor Vulcan', '', '0740824698', NULL, 'fara alergii, fara medicatie'),
('victor0405', 'Victor Ioan Brinzea', '', '0722349489', '2019-05-04', 'fara alergii, fara medicatie'),
('zian2206', 'Zian Matei Vlad', '', '0736243611', '2021-06-22', 'Alergie la vancomicina, tratament neuro');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `date` date NOT NULL,
  `startTime` varchar(5) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `isPublic` tinyint(1) DEFAULT 0,
  `isBillable` tinyint(1) DEFAULT 1,
  `repeating_json` text DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `attendance` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `name`, `details`, `type`, `date`, `startTime`, `duration`, `isPublic`, `isBillable`, `repeating_json`, `comments`, `attendance`) VALUES
('evt1762380491850bmgugzj9t', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-10', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762380491850d87sufkls', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-17', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762380491850pldo8kx3b', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-03', '14:00', 60, 0, 1, '[1]', '', '[]'),
('evt1762380491850rq96xong7', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-24', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623805185481h9gyx5s7', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-03', '15:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623805185482akja668l', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-24', '15:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762380518548gjenvajk3', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-10', '15:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762380518548jhd4sojou', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-17', '15:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623805431329n8qx0plo', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-11', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762380543132jwccciaix', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-25', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762380543132nelu3xquy', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-04', '14:00', 60, 0, 1, '[2]', '', '[]'),
('evt1762380543132yt8e6h1rx', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-18', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17623805750226u9ug61ac', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-18', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762380575022jfudror5r', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-11', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762380575022wp2jgzl6s', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-04', '15:00', 60, 0, 1, '[2]', '', '[]'),
('evt1762380575022wtljub441', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-25', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17623806008640iisg0bu5', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-05', '14:00', 60, 0, 1, '[3]', '', '[]'),
('evt17623806008640n4aa1xqm', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-19', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17623806008643841th918', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-26', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762380600864ey5xr1rmq', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-12', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762380621146272vvcgnt', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-19', '15:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17623806211468gkfbmzt7', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-26', '15:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762380621146lcewb4le9', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-12', '15:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762380621146z9pnr92u5', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-05', '15:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762380655077dvr4yu2oh', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-06', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762380655077hb39f2g0b', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-13', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762380655077x950vuxmu', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-20', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762380655077z8fmsipjg', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-27', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17623806763150aast9717', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-27', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17623806763154yiozi4zv', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-13', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762380676315wweh3mgtt', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-20', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762380676315x3fexxmnn', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-06', '15:00', 60, 0, 1, '[4]', '', '[]'),
('evt1762380705372899b8nxr3', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-28', '13:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762380705372cowe9aqf5', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-21', '13:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762380705372eezjq91xr', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-07', '13:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762380705372rrzy92wgs', 'Terapie - Cezar Casian Dinca', NULL, 'therapy', '2025-11-14', '13:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt176238074082642p405z9w', 'Terapie de grup - Cezar Casian Dinca si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-21', '14:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762380740826dcn37rewo', 'Terapie de grup - Cezar Casian Dinca si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-07', '14:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762380740826md4cv4jod', 'Terapie de grup - Cezar Casian Dinca si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-14', '14:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762380740826wph5fn9eo', 'Terapie de grup - Cezar Casian Dinca si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-28', '14:00', 60, 0, 1, '[5]', '', '[]'),
('evt17623810028071y8mv5c60', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-05', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt17623810028073pnv8vv3s', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-26', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt176238100280765awvd6xv', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-04', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt176238100280770teow4ma', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-19', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt17623810028078583x0puu', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-12', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807gjmwstoyh', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-11', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807htcmx5bvm', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-17', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807imdmz1yug', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-24', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807s8g4gvexi', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-25', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807sxl4i1myw', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-10', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807thupnt89h', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-03', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381002807z9uoq6r1d', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-18', '13:00', 60, 1, 0, '[1,2,3]', '', '[]'),
('evt1762381057840e42xmtwf4', 'Sedinta', NULL, 'sedinta', '2025-11-13', '13:00', 60, 0, 0, '[4]', '', '[]'),
('evt1762381057840hlrz69bjx', 'Sedinta', NULL, 'sedinta', '2025-11-27', '13:00', 60, 0, 0, '[4]', '', '[]'),
('evt1762381057840i4n9ocq5k', 'Savu Rafael', NULL, 'sedinta', '2025-11-06', '13:00', 60, 1, 0, '[]', '', '[]'),
('evt1762381057840s8d3a5wg8', 'Sedinta', NULL, 'sedinta', '2025-11-20', '13:00', 60, 0, 0, '[4]', '', '[]'),
('evt17623811036707um1pkd4b', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-14', '13:00', 60, 1, 0, '[5]', '', '[]'),
('evt17623811036709gjhkkwoy', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-07', '13:00', 60, 1, 0, '[5]', '', '[]'),
('evt1762381103670itlb8s87n', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-21', '13:00', 60, 1, 0, '[5]', '', '[]'),
('evt1762381103671l7q0s877t', 'Pauza de masa', NULL, 'pauza-masa', '2025-11-28', '13:00', 60, 1, 0, '[5]', '', '[]'),
('evt17623818087718jgcw8x5t', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-24', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762381808771cipev88d2', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-03', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762381808771qqi1ptgzu', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-17', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762381808771w8glig1er', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-10', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623818337893bzsrvfs5', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-17', '10:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623818337899nr8hak2t', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-03', '10:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762381833789e1943jz0w', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-24', '10:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762381833789p68tn52vn', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-10', '10:00', 60, 0, 1, '[1]', '', '[]'),
('evt1762382677512feg1gl9ub', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-17', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762382677512ngtiq1mlo', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-03', '11:00', 60, 0, 1, '[1]', '', '[]'),
('evt1762382677512q5yiawj3w', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-24', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762382677512rkdb5ne8m', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-10', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383304637560kig1gy', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-17', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383304637da5aa0ks6', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-24', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383304637m8dt3t3zr', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-03', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383304637p7mu4gqez', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-10', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383363981imkwelpyh', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-03', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383363981k8godazne', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-17', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383363981lauk3bg1t', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-24', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383363981t2v3uhzb7', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-10', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623834304854p8qj004w', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-17', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt176238343048573umtj8sr', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-24', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623834304858r4f0xbw9', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-10', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383430485o2q1urzvi', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-03', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623835469826z0pjiawc', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-24', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383546982cft7ghryd', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-03', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383546982d7ynq46t3', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-10', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383546982oligwt11f', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-17', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383578786bpn1fdhyh', 'Terapie de grup - Stefan Negru si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-10', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383578786q879ksndx', 'Terapie de grup - Stefan Negru si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-17', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383578786wlnq0aaxg', 'Terapie de grup - Stefan Negru si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-03', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383578786yg63evw0j', 'Terapie de grup - Stefan Negru si Victor Ioan Brinzea', NULL, 'group-therapy', '2025-11-24', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623836367119eiun0sdn', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-03', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383636711hp9mxduje', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-24', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383636711pt6vfc63q', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-10', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383636711uj81008zq', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-17', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383662439finkw5pfw', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-17', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383662439lskj20g85', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-24', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383662439stglyuqzz', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-03', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762383662439u4u9f879d', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-10', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623841024433iy8cq1f9', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-03', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17623841024436vs5ibk79', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-17', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762384102443p047kd4a9', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-10', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762384102443vd9pcx7v1', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-24', '17:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt176241833315355ph8t7hf', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-04', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418333153n6n72lxsh', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-18', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418333153qsvffv8lv', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-11', '15:00', 60, 0, 1, '[2]', '', '[]'),
('evt1762418333153t1qrcx9xv', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-25', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418352470d8gmkvui0', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-25', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418352470eoo20r2v8', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-18', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418352470ihcdqfl7w', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-04', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418352470o1id4d403', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-11', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418396242aycn46648', 'Terapie - Eduard Buja', NULL, 'therapy', '2025-11-11', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418396242ekog7m59x', 'Terapie - Eduard Buja', NULL, 'therapy', '2025-11-25', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418396242gufw95am2', 'Terapie - Eduard Buja', NULL, 'therapy', '2025-11-18', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418396242onzawmbnz', 'Terapie - Eduard Buja', NULL, 'therapy', '2025-11-04', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624184346651adp6ip85', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-11', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418434665hirf7040d', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-18', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418434665iitl87l9y', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-04', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418434665ko9g38auk', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-25', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt176241846416452mrh914s', 'Terapie - Toni (Antonie-Ioan) Dumitru', NULL, 'therapy', '2025-11-11', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624184641646cd6rexnw', 'Terapie - Toni (Antonie-Ioan) Dumitru', NULL, 'therapy', '2025-11-04', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418464164nmxukhxg6', 'Terapie - Toni (Antonie-Ioan) Dumitru', NULL, 'therapy', '2025-11-18', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762418464164rpvzaram4', 'Terapie - Toni (Antonie-Ioan) Dumitru', NULL, 'therapy', '2025-11-25', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624190717978ug0n70if', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-18', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419071797fuxck92mx', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-04', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419071797lzt58r4rx', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-11', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419071797mx9fws0x9', 'Terapie - Emilia Ioana Ipate', NULL, 'therapy', '2025-11-25', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419092487bdtcbfake', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-25', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419092487ihm0kf48x', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-04', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419092487s142moehk', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-11', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419092487y3unbswk2', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-18', '15:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt176241911348212auoh4mq', 'Terapie - Petru Eric Croitoru', NULL, 'therapy', '2025-11-18', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419113482km406v01v', 'Terapie - Petru Eric Croitoru', NULL, 'therapy', '2025-11-11', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419113482pk38jp397', 'Terapie - Petru Eric Croitoru', NULL, 'therapy', '2025-11-25', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419113482vw0c4mhd6', 'Terapie - Petru Eric Croitoru', NULL, 'therapy', '2025-11-04', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt176241915273827902pehy', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-11', '11:00', 60, 0, 1, '[2]', '', '[]'),
('evt17624191527384dd0cgnk7', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-25', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419152738kadiu5o3b', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-04', '11:00', 60, 0, 1, '[2]', '', '[]'),
('evt1762419152738p4syew1ch', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-18', '11:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419178326abg2xl8s0', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-04', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419178326ahmgg94vd', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-18', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419178326bxghcp690', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-11', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419178326lzdn2z4ex', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-25', '14:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624192135988tc8uhbip', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-04', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624192135989afh1fpy1', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-18', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419213598bdlxusjq2', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-25', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762419213598im90yd9sm', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-11', '17:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt176242059479769vidxumu', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-04', '10:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624205947979rb19zoiz', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-25', '10:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420594797cs40i3zzb', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-18', '10:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420594797t89ryc8u5', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-11', '10:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt176242062069192l4lusms', 'Terapie - Matei Serban Curelea', NULL, 'therapy', '2025-11-18', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420620691gng3t2a77', 'Terapie - Matei Serban Curelea', NULL, 'therapy', '2025-11-25', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420620691piq9o08b0', 'Terapie - Matei Serban Curelea', NULL, 'therapy', '2025-11-04', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420620691tydvja5vh', 'Terapie - Matei Serban Curelea', NULL, 'therapy', '2025-11-11', '12:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420645631275wk73wf', 'Terapie - Pavel Ilan Croitoru', NULL, 'therapy', '2025-11-04', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420645631ilo1rhl1s', 'Terapie - Pavel Ilan Croitoru', NULL, 'therapy', '2025-11-18', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420645631rdrenrbd3', 'Terapie - Pavel Ilan Croitoru', NULL, 'therapy', '2025-11-25', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420645631zzanobsqy', 'Terapie - Pavel Ilan Croitoru', NULL, 'therapy', '2025-11-11', '16:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624207373393kd6b6z8b', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-04', '18:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420737339ru6gjcsc8', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-11', '18:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420737339srts3zjv1', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-18', '18:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt1762420737339tn86d8o18', 'Terapie - Adelina Maria Laura Letu', NULL, 'therapy', '2025-11-25', '18:00', 60, 0, 1, '[2]', NULL, '[]'),
('evt17624207845063w81al3mc', 'Terapie - Maia Berghian', NULL, 'therapy', '2025-11-12', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624207845069awsggd50', 'Terapie - Maia Berghian', NULL, 'therapy', '2025-11-26', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420784506eowbzx3rb', 'Terapie - Maia Berghian', NULL, 'therapy', '2025-11-05', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420784506tp28ejn7j', 'Terapie - Maia Berghian', NULL, 'therapy', '2025-11-19', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624208154225iakq3prr', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-19', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420815422l7u8xhtyb', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-05', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420815422o9j3qqyta', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-26', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420815422xpzfgz2d8', 'Terapie - Valentin Alexandru Rimbu', NULL, 'therapy', '2025-11-12', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624208338561tnuvxbqx', 'Terapie - Evelin Ioana Matache', NULL, 'therapy', '2025-11-05', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420833856kixmm9pfs', 'Terapie - Evelin Ioana Matache', NULL, 'therapy', '2025-11-19', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420833856vs26k1za2', 'Terapie - Evelin Ioana Matache', NULL, 'therapy', '2025-11-12', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420833856ytxht7zso', 'Terapie - Evelin Ioana Matache', NULL, 'therapy', '2025-11-26', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624208565235cuyr3mso', 'Terapie - Clara Medeea Postolache', NULL, 'therapy', '2025-11-26', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420856523assoy5rh4', 'Terapie - Clara Medeea Postolache', NULL, 'therapy', '2025-11-05', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420856523onmvcrbmt', 'Terapie - Clara Medeea Postolache', NULL, 'therapy', '2025-11-19', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420856523qss8no34f', 'Terapie - Clara Medeea Postolache', NULL, 'therapy', '2025-11-12', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420885784a0r07zj1b', 'Terapie - Maher Kadour si Rami Kadour', NULL, 'therapy', '2025-11-26', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420885784ea5xqprex', 'Terapie - Maher Kadour si Rami Kadour', NULL, 'therapy', '2025-11-12', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420885784mfgjaxg3h', 'Terapie - Maher Kadour si Rami Kadour', NULL, 'therapy', '2025-11-05', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420885784mnthdl6hf', 'Terapie - Maher Kadour si Rami Kadour', NULL, 'therapy', '2025-11-19', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420909462fki85yd3q', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-19', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420909462orjvfx2m4', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-26', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420909462twx2eh5ac', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-05', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762420909462y8yoj6ouv', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-12', '09:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624210301351zrgyokzz', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-26', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421030135a1kn1ilja', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-05', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421030135nc5pwkwnx', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-19', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421030135yx4zt25x1', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-12', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624210526918dpibdlj3', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-19', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624210526919gxdbo9tl', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-05', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421052691v6tkhex2p', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-26', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421052691yzwoduo8t', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-12', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421347600165td7k1w', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-05', '11:00', 60, 0, 1, '[3]', '', '[]'),
('evt17624213476003cuozkiym', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-26', '11:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421347600ahwyqq6i4', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-12', '11:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421347600yo0j76sb3', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-19', '11:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421442403otbu5223k', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-19', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421442403r5y13ii29', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-12', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421442403vgxwav3f8', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-05', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421442403wb4ahanwo', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-26', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt176242146598659sjocvmp', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-19', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624214659867p5s18z2l', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-12', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421465986bnd8t2ucc', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-05', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421465986xfjzvbj6p', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-26', '16:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt176242148786424olhm7j0', 'Terapie - Dominic Mihail Georgescu', NULL, 'therapy', '2025-11-19', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421487864caz0btrud', 'Terapie - Dominic Mihail Georgescu', NULL, 'therapy', '2025-11-12', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421487864d2qmz0oy3', 'Terapie - Dominic Mihail Georgescu', NULL, 'therapy', '2025-11-26', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421487864nl1rd6a4i', 'Terapie - Dominic Mihail Georgescu', NULL, 'therapy', '2025-11-05', '17:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421509750eia2u28cc', 'Terapie - Efremia Niculescu', NULL, 'therapy', '2025-11-19', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421509750lrsxyhjvv', 'Terapie - Efremia Niculescu', NULL, 'therapy', '2025-11-12', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421509750n3p3dvbc3', 'Terapie - Efremia Niculescu', NULL, 'therapy', '2025-11-26', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421509750z2iaqu14d', 'Terapie - Efremia Niculescu', NULL, 'therapy', '2025-11-05', '14:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt17624215238011c5hz31gr', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-19', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421523801dr7zcocfr', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-12', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421523801j96hm7ffo', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-26', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt1762421523801lkchofv1t', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-05', '10:00', 60, 0, 1, '[3]', NULL, '[]'),
('evt176242237171934syxjqan', 'Terapie - Gabriela Cristiana Maria Cozma', NULL, 'therapy', '2025-11-27', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt176242237171967g2jx5lk', 'Terapie - Gabriela Cristiana Maria Cozma', NULL, 'therapy', '2025-11-06', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422371719rys821vex', 'Terapie - Gabriela Cristiana Maria Cozma', NULL, 'therapy', '2025-11-20', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422371719w8wqzhsr7', 'Terapie - Gabriela Cristiana Maria Cozma', NULL, 'therapy', '2025-11-13', '15:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624223983388kol1sv9d', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-27', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422398338fcpj9bt7j', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-06', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422398338pfepfvete', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-13', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422398338q8uy07dmw', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-20', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624224171422jo85kszw', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-27', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt176242241714232p6e0ks5', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-20', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624224171427itfsvbm8', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-06', '17:00', 60, 0, 1, '[4]', '', '[]'),
('evt1762422417142re90l7jks', 'Terapie - Rares Alexandru Ghita', NULL, 'therapy', '2025-11-13', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422464134bvw2854aq', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-20', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422464134digoe3ioz', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-13', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422464134j8su8fgqw', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-27', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422464134vkc5lj18k', 'Terapie - Ana Maria Zamfir', NULL, 'therapy', '2025-11-06', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624224874681d0ygqkb9', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-13', '18:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624224874685hzy5mb1y', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-20', '18:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422487468hnwp6uk4z', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-27', '18:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422487468i3lh4o6f6', 'Terapie - David Marian Burticel', NULL, 'therapy', '2025-11-06', '18:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624225998055u7pkxwdj', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-27', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422599805daty5gikc', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-20', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422599805jls8ffvur', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-06', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422599805xsm660n1o', 'Terapie - Mathias Alexandru Staicu', NULL, 'therapy', '2025-11-13', '14:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624228292864cli93zg4', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-20', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422829286agtf1z7bg', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-06', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422829286kwyj7jd1y', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-13', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422829286mvgq438bf', 'Terapie - Tom Andrei Potecaru', NULL, 'therapy', '2025-11-27', '16:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422849000azlq7lkk9', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-20', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422849000b2bxn4d60', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-06', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422849000oqtceeu2b', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-27', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt1762422849000qddili9us', 'Terapie - Stefan Negru', NULL, 'therapy', '2025-11-13', '17:00', 60, 0, 1, '[4]', NULL, '[]'),
('evt17624230937410orcy2shl', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-28', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt17624230937419t1zmsql0', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-14', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423093741ili5p905l', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-21', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423093741l9xe4xxj1', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-07', '10:00', 60, 0, 1, '[5]', '', '[]'),
('evt17624231199398tq6fsnl3', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-21', '09:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423119939cycuxaw40', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-14', '09:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423119939e8cfikjxb', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-28', '09:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423119939erk76gdtw', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-07', '09:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762423139863d7c07obpz', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-07', '11:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762423139863gllegvky8', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-21', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423139863qxuwvs31p', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-28', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423139863umeadko7o', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-14', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt17624231837212itl3nvmc', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-14', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt176242318372138z4cz1qk', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-07', '10:00', 60, 0, 1, '[5]', 'absenta motivat', '[]'),
('evt1762423183721mx5neloxt', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-28', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423183721y7uh7tfbi', 'Terapie - Nectaria Stefania Rusu', NULL, 'therapy', '2025-11-21', '10:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423200502kg9hkkraz', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-14', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423200502pmwbdjtdc', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-28', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423200502wmh69lqvl', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-21', '11:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423200502yq999m70g', 'Terapie - Tudor Condruc', NULL, 'therapy', '2025-11-07', '11:00', 60, 0, 1, '[5]', '', '[]'),
('evt17624232302330orq9v7kt', 'Terapie - Medeea Ana Gabrielea Anghel', NULL, 'therapy', '2025-11-07', '12:00', 60, 0, 1, '[5]', '', '[]'),
('evt176242323023352cld9zav', 'Terapie - Medeea Ana Gabrielea Anghel', NULL, 'therapy', '2025-11-28', '12:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423230233boc8lkjjt', 'Terapie - Medeea Ana Gabrielea Anghel', NULL, 'therapy', '2025-11-14', '12:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423230233ey5j2z216', 'Terapie - Medeea Ana Gabrielea Anghel', NULL, 'therapy', '2025-11-21', '12:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt176242326058294l4ikxr0', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-07', '15:00', 60, 0, 1, '[5]', '', '[]'),
('evt1762423260582k46ba0m3l', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-28', '15:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423260582kt1si0gl5', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-14', '15:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762423260582qf6b1i4ib', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-21', '15:00', 60, 0, 1, '[5]', NULL, '[]'),
('evt1762535172546425ytwzjf', 'Terapie - client test 3', NULL, 'therapy', '2025-11-03', '08:00', 60, 0, 1, '[1,2,3]', '', '{\"client1111\":\"absent\"}'),
('evt17625351725464ze75w8c0', 'Terapie - client test 3', NULL, 'therapy', '2025-11-11', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt17625351725466kek731vk', 'Terapie - client test 3', NULL, 'therapy', '2025-11-25', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt17625351725466mw9syydx', 'Terapie - client test 3', NULL, 'therapy', '2025-11-05', '08:00', 60, 0, 1, '[1,2,3]', '', '[]'),
('evt17625351725466rzmmrqa0', 'Terapie - client test 3', NULL, 'therapy', '2025-11-04', '08:00', 60, 0, 1, '[1,2,3]', '', '{\"client1111\":\"absent-motivated\"}'),
('evt1762535172546ajiqp38z0', 'Terapie - client test 3', NULL, 'therapy', '2025-11-12', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546atw689tpa', 'Terapie - client test 3', NULL, 'therapy', '2025-11-24', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546bqqrh5rgh', 'Terapie - client test 3', NULL, 'therapy', '2025-11-19', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546fux0cfity', 'Terapie - client test 3', NULL, 'therapy', '2025-11-17', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546kcsdo5aig', 'Terapie - client test 3', NULL, 'therapy', '2025-11-18', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546v6qn9lvur', 'Terapie - client test 3', NULL, 'therapy', '2025-11-10', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt1762535172546ytfx3vple', 'Terapie - client test 3', NULL, 'therapy', '2025-11-26', '08:00', 60, 0, 1, '[1,2,3]', NULL, '[]'),
('evt17625355690944zl3ilkb3', 'Sedinta - Maher Kadour', NULL, 'sedinta', '2025-11-06', '09:00', 60, 0, 1, '[]', NULL, '[]'),
('evt1762535658735feg191al2', 'Terapie - Rami Kadour', NULL, 'therapy', '2025-11-06', '09:00', 60, 0, 1, '[]', NULL, '[]'),
('evt17625360359116jk34etge', 'Terapie - Joy', NULL, 'therapy', '2025-11-21', '11:00', 60, 0, 0, '[5]', NULL, '[]'),
('evt1762536035911a8wlgt9k6', 'Terapie - Joy', NULL, 'therapy', '2025-11-14', '11:00', 60, 0, 0, '[5]', '', '[]'),
('evt1762536035911efnviuzbl', 'Terapie - Joy', NULL, 'therapy', '2025-11-07', '11:00', 60, 0, 0, '[5]', '', '[]'),
('evt1762536035911tmco23h23', 'Terapie - Joy', NULL, 'therapy', '2025-11-28', '11:00', 60, 0, 0, '[5]', NULL, '[]'),
('evt1762552034302h1cr30akk', 'Dezvoltare personala - Amalia Vespan ', NULL, 'dezvoltare-personala', '2025-11-17', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552034302pyxrfug26', 'Dezvoltare personala - Amalia Vespan ', NULL, 'dezvoltare-personala', '2025-11-24', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552034302tmj4xl1tb', 'Dezvoltare personala - Amalia Vespan ', NULL, 'dezvoltare-personala', '2025-11-10', '09:00', 60, 0, 1, '[1]', '', '[]'),
('evt17625521137952nsxsb1am', 'Dezvoltare personala - Mocanu Alexandru Matei', NULL, 'dezvoltare-personala', '2025-11-17', '10:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552113795daebk9mk7', 'Dezvoltare personala - Mocanu Alexandru Matei', NULL, 'dezvoltare-personala', '2025-11-10', '10:00', 60, 0, 1, '[1]', '', '[]'),
('evt1762552113795py31yvv4b', 'Dezvoltare personala - Mocanu Alexandru Matei', NULL, 'dezvoltare-personala', '2025-11-24', '10:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt17625522431208ldrlflp5', 'Dezvoltare personala - Ionescu Ecaterina ', NULL, 'dezvoltare-personala', '2025-11-10', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552243122dbid5msqp', 'Dezvoltare personala - Ionescu Ecaterina ', NULL, 'dezvoltare-personala', '2025-11-24', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552243122soz7corsg', 'Dezvoltare personala - Ionescu Ecaterina ', NULL, 'dezvoltare-personala', '2025-11-17', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552314822cal5s1qyp', 'Terapie de grup - Ana Maria Zamfir si Adelina Maria Laura Letu', NULL, 'group-therapy', '2025-11-24', '18:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552314822kn6u685xc', 'Terapie de grup - Ana Maria Zamfir si Adelina Maria Laura Letu', NULL, 'group-therapy', '2025-11-17', '18:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552314822x54r4nxgk', 'Terapie de grup - Ana Maria Zamfir si Adelina Maria Laura Letu', NULL, 'group-therapy', '2025-11-10', '18:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552380813b29xaqnh6', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-17', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552380813b3fz0v4bo', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-24', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552380813qa5iinucj', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-10', '09:00', 60, 0, 1, '[1]', '', '[]'),
('evt17625524806284o21b426d', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-10', '09:00', 60, 0, 1, '[1]', '', '[]'),
('evt1762552480628l3jhc6c96', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-24', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552480628suvt8vnpj', 'Terapie - Zian Matei Vlad', NULL, 'therapy', '2025-11-17', '09:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt176255256736332mmzhthi', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-12', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552567363cfo5yrzq3', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-19', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552567363qe08pes0x', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-17', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552567363rmjm1s2hk', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-26', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552567363wapeyr3cx', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-24', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552567363x384cpggl', 'logopedie - Gabriela Cristiana Maria Cozma', NULL, 'logopedie', '2025-11-10', '10:00', 60, 0, 1, '[1,3]', NULL, '[]'),
('evt1762552621020cu7ttqv3a', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-17', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552621020kd7wr1muv', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-10', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552621020ulvj99wyx', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-24', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552695960h28b29b65', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-24', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552695960nyskdoyxh', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-10', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552695960sxm4vwfkv', 'Terapie - Denis Georgian Mehangief', NULL, 'therapy', '2025-11-17', '11:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt176255275759500cxo4qh1', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-17', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552757595493uc0lqp', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-10', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552757595kr6l0osam', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-18', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552757595nkf4b68ft', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-11', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552757595s5uaa08vw', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-25', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552757595swqejjwf6', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-24', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt176255281711407uz95pvv', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-11', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt176255281711444w0lki5y', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-17', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552817114fgvhhu9wv', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-25', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552817114syugjuq68', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-10', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552817114wq7t82i1f', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-18', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt1762552817114zrlgbolec', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-24', '14:00', 60, 0, 1, '[1,2]', NULL, '[]'),
('evt17625528712386trg20m7e', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-17', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552871238gvw7bh8ae', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-10', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552871238hedzulval', 'logopedie - Emilia Ioana Ipate', NULL, 'logopedie', '2025-11-24', '14:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552939801gaf7kiqq4', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-17', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552939801k4jywyyho', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-24', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762552939801xfd2bih20', 'Terapie - Victor Ioan Brinzea', NULL, 'therapy', '2025-11-10', '16:00', 60, 0, 1, '[1]', NULL, '[]'),
('evt1762606825669deolwph1r', 'Coordonare - client test 3', NULL, 'coordination', '2025-11-08', '08:00', 120, 0, 1, '[]', 'test', '[]');

-- --------------------------------------------------------

--
-- Table structure for table `event_clients`
--

CREATE TABLE `event_clients` (
  `event_id` varchar(255) NOT NULL,
  `client_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `event_clients`
--

INSERT INTO `event_clients` (`event_id`, `client_id`) VALUES
('evt1762380491850bmgugzj9t', 'cezar1802'),
('evt1762380491850d87sufkls', 'cezar1802'),
('evt1762380491850pldo8kx3b', 'cezar1802'),
('evt1762380491850rq96xong7', 'cezar1802'),
('evt17623805185481h9gyx5s7', 'cezar1802'),
('evt17623805185482akja668l', 'cezar1802'),
('evt1762380518548gjenvajk3', 'cezar1802'),
('evt1762380518548jhd4sojou', 'cezar1802'),
('evt17623805431329n8qx0plo', 'cezar1802'),
('evt1762380543132jwccciaix', 'cezar1802'),
('evt1762380543132nelu3xquy', 'cezar1802'),
('evt1762380543132yt8e6h1rx', 'cezar1802'),
('evt17623805750226u9ug61ac', 'cezar1802'),
('evt1762380575022jfudror5r', 'cezar1802'),
('evt1762380575022wp2jgzl6s', 'cezar1802'),
('evt1762380575022wtljub441', 'cezar1802'),
('evt17623806008640iisg0bu5', 'cezar1802'),
('evt17623806008640n4aa1xqm', 'cezar1802'),
('evt17623806008643841th918', 'cezar1802'),
('evt1762380600864ey5xr1rmq', 'cezar1802'),
('evt1762380621146272vvcgnt', 'cezar1802'),
('evt17623806211468gkfbmzt7', 'cezar1802'),
('evt1762380621146lcewb4le9', 'cezar1802'),
('evt1762380621146z9pnr92u5', 'cezar1802'),
('evt1762380655077dvr4yu2oh', 'cezar1802'),
('evt1762380655077hb39f2g0b', 'cezar1802'),
('evt1762380655077x950vuxmu', 'cezar1802'),
('evt1762380655077z8fmsipjg', 'cezar1802'),
('evt17623806763150aast9717', 'cezar1802'),
('evt17623806763154yiozi4zv', 'cezar1802'),
('evt1762380676315wweh3mgtt', 'cezar1802'),
('evt1762380676315x3fexxmnn', 'cezar1802'),
('evt1762380705372899b8nxr3', 'cezar1802'),
('evt1762380705372cowe9aqf5', 'cezar1802'),
('evt1762380705372eezjq91xr', 'cezar1802'),
('evt1762380705372rrzy92wgs', 'cezar1802'),
('evt176238074082642p405z9w', 'cezar1802'),
('evt176238074082642p405z9w', 'victor0405'),
('evt1762380740826dcn37rewo', 'cezar1802'),
('evt1762380740826dcn37rewo', 'victor0405'),
('evt1762380740826md4cv4jod', 'cezar1802'),
('evt1762380740826md4cv4jod', 'victor0405'),
('evt1762380740826wph5fn9eo', 'cezar1802'),
('evt1762380740826wph5fn9eo', 'victor0405'),
('evt17623818087718jgcw8x5t', 'zian2206'),
('evt1762381808771cipev88d2', 'zian2206'),
('evt1762381808771qqi1ptgzu', 'zian2206'),
('evt1762381808771w8glig1er', 'zian2206'),
('evt17623818337893bzsrvfs5', 'zian2206'),
('evt17623818337899nr8hak2t', 'zian2206'),
('evt1762381833789e1943jz0w', 'zian2206'),
('evt1762381833789p68tn52vn', 'zian2206'),
('evt1762382677512feg1gl9ub', 'tudor0107'),
('evt1762382677512ngtiq1mlo', 'tudor0107'),
('evt1762382677512q5yiawj3w', 'tudor0107'),
('evt1762382677512rkdb5ne8m', 'tudor0107'),
('evt1762383304637560kig1gy', 'david0610'),
('evt1762383304637da5aa0ks6', 'david0610'),
('evt1762383304637m8dt3t3zr', 'david0610'),
('evt1762383304637p7mu4gqez', 'david0610'),
('evt1762383363981imkwelpyh', 'rares3005'),
('evt1762383363981k8godazne', 'rares3005'),
('evt1762383363981lauk3bg1t', 'rares3005'),
('evt1762383363981t2v3uhzb7', 'rares3005'),
('evt17623834304854p8qj004w', 'emilia1207'),
('evt176238343048573umtj8sr', 'emilia1207'),
('evt17623834304858r4f0xbw9', 'emilia1207'),
('evt1762383430485o2q1urzvi', 'emilia1207'),
('evt17623835469826z0pjiawc', 'victor0405'),
('evt1762383546982cft7ghryd', 'victor0405'),
('evt1762383546982d7ynq46t3', 'victor0405'),
('evt1762383546982oligwt11f', 'victor0405'),
('evt1762383578786bpn1fdhyh', 'stefan6428'),
('evt1762383578786bpn1fdhyh', 'victor0405'),
('evt1762383578786q879ksndx', 'stefan6428'),
('evt1762383578786q879ksndx', 'victor0405'),
('evt1762383578786wlnq0aaxg', 'stefan6428'),
('evt1762383578786wlnq0aaxg', 'victor0405'),
('evt1762383578786yg63evw0j', 'stefan6428'),
('evt1762383578786yg63evw0j', 'victor0405'),
('evt17623836367119eiun0sdn', 'stefan6428'),
('evt1762383636711hp9mxduje', 'stefan6428'),
('evt1762383636711pt6vfc63q', 'stefan6428'),
('evt1762383636711uj81008zq', 'stefan6428'),
('evt1762383662439finkw5pfw', 'adelina2511'),
('evt1762383662439lskj20g85', 'adelina2511'),
('evt1762383662439stglyuqzz', 'adelina2511'),
('evt1762383662439u4u9f879d', 'adelina2511'),
('evt17623841024433iy8cq1f9', 'ana2107'),
('evt17623841024436vs5ibk79', 'ana2107'),
('evt1762384102443p047kd4a9', 'ana2107'),
('evt1762384102443vd9pcx7v1', 'ana2107'),
('evt176241833315355ph8t7hf', 'tudor0107'),
('evt1762418333153n6n72lxsh', 'tudor0107'),
('evt1762418333153qsvffv8lv', 'tudor0107'),
('evt1762418333153t1qrcx9xv', 'tudor0107'),
('evt1762418352470d8gmkvui0', 'david0610'),
('evt1762418352470eoo20r2v8', 'david0610'),
('evt1762418352470ihcdqfl7w', 'david0610'),
('evt1762418352470o1id4d403', 'david0610'),
('evt1762418396242aycn46648', 'eduard3108'),
('evt1762418396242ekog7m59x', 'eduard3108'),
('evt1762418396242gufw95am2', 'eduard3108'),
('evt1762418396242onzawmbnz', 'eduard3108'),
('evt17624184346651adp6ip85', 'valentin1611'),
('evt1762418434665hirf7040d', 'valentin1611'),
('evt1762418434665iitl87l9y', 'valentin1611'),
('evt1762418434665ko9g38auk', 'valentin1611'),
('evt176241846416452mrh914s', 'toni1505'),
('evt17624184641646cd6rexnw', 'toni1505'),
('evt1762418464164nmxukhxg6', 'toni1505'),
('evt1762418464164rpvzaram4', 'toni1505'),
('evt17624190717978ug0n70if', 'emilia1207'),
('evt1762419071797fuxck92mx', 'emilia1207'),
('evt1762419071797lzt58r4rx', 'emilia1207'),
('evt1762419071797mx9fws0x9', 'emilia1207'),
('evt1762419092487bdtcbfake', 'mathias1501'),
('evt1762419092487ihm0kf48x', 'mathias1501'),
('evt1762419092487s142moehk', 'mathias1501'),
('evt1762419092487y3unbswk2', 'mathias1501'),
('evt176241911348212auoh4mq', 'petru2012'),
('evt1762419113482km406v01v', 'petru2012'),
('evt1762419113482pk38jp397', 'petru2012'),
('evt1762419113482vw0c4mhd6', 'petru2012'),
('evt176241915273827902pehy', 'tudor0107'),
('evt17624191527384dd0cgnk7', 'tudor0107'),
('evt1762419152738kadiu5o3b', 'tudor0107'),
('evt1762419152738p4syew1ch', 'tudor0107'),
('evt1762419178326abg2xl8s0', 'mathias1501'),
('evt1762419178326ahmgg94vd', 'mathias1501'),
('evt1762419178326bxghcp690', 'mathias1501'),
('evt1762419178326lzdn2z4ex', 'mathias1501'),
('evt17624192135988tc8uhbip', 'adelina2511'),
('evt17624192135989afh1fpy1', 'adelina2511'),
('evt1762419213598bdlxusjq2', 'adelina2511'),
('evt1762419213598im90yd9sm', 'adelina2511'),
('evt176242059479769vidxumu', 'valentin1611'),
('evt17624205947979rb19zoiz', 'valentin1611'),
('evt1762420594797cs40i3zzb', 'valentin1611'),
('evt1762420594797t89ryc8u5', 'valentin1611'),
('evt176242062069192l4lusms', 'matei2709'),
('evt1762420620691gng3t2a77', 'matei2709'),
('evt1762420620691piq9o08b0', 'matei2709'),
('evt1762420620691tydvja5vh', 'matei2709'),
('evt1762420645631275wk73wf', 'pavel1510'),
('evt1762420645631ilo1rhl1s', 'pavel1510'),
('evt1762420645631rdrenrbd3', 'pavel1510'),
('evt1762420645631zzanobsqy', 'pavel1510'),
('evt17624207373393kd6b6z8b', 'adelina2511'),
('evt1762420737339ru6gjcsc8', 'adelina2511'),
('evt1762420737339srts3zjv1', 'adelina2511'),
('evt1762420737339tn86d8o18', 'adelina2511'),
('evt17624207845063w81al3mc', 'maia2903'),
('evt17624207845069awsggd50', 'maia2903'),
('evt1762420784506eowbzx3rb', 'maia2903'),
('evt1762420784506tp28ejn7j', 'maia2903'),
('evt17624208154225iakq3prr', 'valentin1611'),
('evt1762420815422l7u8xhtyb', 'valentin1611'),
('evt1762420815422o9j3qqyta', 'valentin1611'),
('evt1762420815422xpzfgz2d8', 'valentin1611'),
('evt17624208338561tnuvxbqx', 'evelin2211'),
('evt1762420833856kixmm9pfs', 'evelin2211'),
('evt1762420833856vs26k1za2', 'evelin2211'),
('evt1762420833856ytxht7zso', 'evelin2211'),
('evt17624208565235cuyr3mso', 'clara2109'),
('evt1762420856523assoy5rh4', 'clara2109'),
('evt1762420856523onmvcrbmt', 'clara2109'),
('evt1762420856523qss8no34f', 'clara2109'),
('evt1762420885784a0r07zj1b', 'maher1110'),
('evt1762420885784a0r07zj1b', 'rami1110'),
('evt1762420885784ea5xqprex', 'maher1110'),
('evt1762420885784ea5xqprex', 'rami1110'),
('evt1762420885784mfgjaxg3h', 'maher1110'),
('evt1762420885784mfgjaxg3h', 'rami1110'),
('evt1762420885784mnthdl6hf', 'maher1110'),
('evt1762420885784mnthdl6hf', 'rami1110'),
('evt1762420909462fki85yd3q', 'zian2206'),
('evt1762420909462orjvfx2m4', 'zian2206'),
('evt1762420909462twx2eh5ac', 'zian2206'),
('evt1762420909462y8yoj6ouv', 'zian2206'),
('evt17624210301351zrgyokzz', 'tom0903'),
('evt1762421030135a1kn1ilja', 'tom0903'),
('evt1762421030135nc5pwkwnx', 'tom0903'),
('evt1762421030135yx4zt25x1', 'tom0903'),
('evt17624210526918dpibdlj3', 'nectaria0401'),
('evt17624210526919gxdbo9tl', 'nectaria0401'),
('evt1762421052691v6tkhex2p', 'nectaria0401'),
('evt1762421052691yzwoduo8t', 'nectaria0401'),
('evt1762421347600165td7k1w', 'tudor0107'),
('evt17624213476003cuozkiym', 'tudor0107'),
('evt1762421347600ahwyqq6i4', 'tudor0107'),
('evt1762421347600yo0j76sb3', 'tudor0107'),
('evt1762421442403otbu5223k', 'victor0405'),
('evt1762421442403r5y13ii29', 'victor0405'),
('evt1762421442403vgxwav3f8', 'victor0405'),
('evt1762421442403wb4ahanwo', 'victor0405'),
('evt176242146598659sjocvmp', 'victor0405'),
('evt17624214659867p5s18z2l', 'victor0405'),
('evt1762421465986bnd8t2ucc', 'victor0405'),
('evt1762421465986xfjzvbj6p', 'victor0405'),
('evt176242148786424olhm7j0', 'dominic0307'),
('evt1762421487864caz0btrud', 'dominic0307'),
('evt1762421487864d2qmz0oy3', 'dominic0307'),
('evt1762421487864nl1rd6a4i', 'dominic0307'),
('evt1762421509750eia2u28cc', 'efremia1701'),
('evt1762421509750lrsxyhjvv', 'efremia1701'),
('evt1762421509750n3p3dvbc3', 'efremia1701'),
('evt1762421509750z2iaqu14d', 'efremia1701'),
('evt17624215238011c5hz31gr', 'zian2206'),
('evt1762421523801dr7zcocfr', 'zian2206'),
('evt1762421523801j96hm7ffo', 'zian2206'),
('evt1762421523801lkchofv1t', 'zian2206'),
('evt176242237171934syxjqan', 'gabriela0307'),
('evt176242237171967g2jx5lk', 'gabriela0307'),
('evt1762422371719rys821vex', 'gabriela0307'),
('evt1762422371719w8wqzhsr7', 'gabriela0307'),
('evt17624223983388kol1sv9d', 'stefan6428'),
('evt1762422398338fcpj9bt7j', 'stefan6428'),
('evt1762422398338pfepfvete', 'stefan6428'),
('evt1762422398338q8uy07dmw', 'stefan6428'),
('evt17624224171422jo85kszw', 'rares3005'),
('evt176242241714232p6e0ks5', 'rares3005'),
('evt17624224171427itfsvbm8', 'rares3005'),
('evt1762422417142re90l7jks', 'rares3005'),
('evt1762422464134bvw2854aq', 'ana2107'),
('evt1762422464134digoe3ioz', 'ana2107'),
('evt1762422464134j8su8fgqw', 'ana2107'),
('evt1762422464134vkc5lj18k', 'ana2107'),
('evt17624224874681d0ygqkb9', 'david0610'),
('evt17624224874685hzy5mb1y', 'david0610'),
('evt1762422487468hnwp6uk4z', 'david0610'),
('evt1762422487468i3lh4o6f6', 'david0610'),
('evt17624225998055u7pkxwdj', 'mathias1501'),
('evt1762422599805daty5gikc', 'mathias1501'),
('evt1762422599805jls8ffvur', 'mathias1501'),
('evt1762422599805xsm660n1o', 'mathias1501'),
('evt17624228292864cli93zg4', 'tom0903'),
('evt1762422829286agtf1z7bg', 'tom0903'),
('evt1762422829286kwyj7jd1y', 'tom0903'),
('evt1762422829286mvgq438bf', 'tom0903'),
('evt1762422849000azlq7lkk9', 'stefan6428'),
('evt1762422849000b2bxn4d60', 'stefan6428'),
('evt1762422849000oqtceeu2b', 'stefan6428'),
('evt1762422849000qddili9us', 'stefan6428'),
('evt17624230937410orcy2shl', 'zian2206'),
('evt17624230937419t1zmsql0', 'zian2206'),
('evt1762423093741ili5p905l', 'zian2206'),
('evt1762423093741l9xe4xxj1', 'zian2206'),
('evt17624231199398tq6fsnl3', 'zian2206'),
('evt1762423119939cycuxaw40', 'zian2206'),
('evt1762423119939e8cfikjxb', 'zian2206'),
('evt1762423119939erk76gdtw', 'zian2206'),
('evt1762423139863d7c07obpz', 'nectaria0401'),
('evt1762423139863gllegvky8', 'nectaria0401'),
('evt1762423139863qxuwvs31p', 'nectaria0401'),
('evt1762423139863umeadko7o', 'nectaria0401'),
('evt17624231837212itl3nvmc', 'nectaria0401'),
('evt176242318372138z4cz1qk', 'nectaria0401'),
('evt1762423183721mx5neloxt', 'nectaria0401'),
('evt1762423183721y7uh7tfbi', 'nectaria0401'),
('evt1762423200502kg9hkkraz', 'tudor0107'),
('evt1762423200502pmwbdjtdc', 'tudor0107'),
('evt1762423200502wmh69lqvl', 'tudor0107'),
('evt1762423200502yq999m70g', 'tudor0107'),
('evt17624232302330orq9v7kt', 'medeea1611'),
('evt176242323023352cld9zav', 'medeea1611'),
('evt1762423230233boc8lkjjt', 'medeea1611'),
('evt1762423230233ey5j2z216', 'medeea1611'),
('evt176242326058294l4ikxr0', 'victor0405'),
('evt1762423260582k46ba0m3l', 'victor0405'),
('evt1762423260582kt1si0gl5', 'victor0405'),
('evt1762423260582qf6b1i4ib', 'victor0405'),
('evt1762535172546425ytwzjf', 'client1111'),
('evt17625351725464ze75w8c0', 'client1111'),
('evt17625351725466kek731vk', 'client1111'),
('evt17625351725466mw9syydx', 'client1111'),
('evt17625351725466rzmmrqa0', 'client1111'),
('evt1762535172546ajiqp38z0', 'client1111'),
('evt1762535172546atw689tpa', 'client1111'),
('evt1762535172546bqqrh5rgh', 'client1111'),
('evt1762535172546fux0cfity', 'client1111'),
('evt1762535172546kcsdo5aig', 'client1111'),
('evt1762535172546v6qn9lvur', 'client1111'),
('evt1762535172546ytfx3vple', 'client1111'),
('evt17625355690944zl3ilkb3', 'maher1110'),
('evt1762535658735feg191al2', 'rami1110'),
('evt17625360359116jk34etge', 'joy4567'),
('evt1762536035911a8wlgt9k6', 'joy4567'),
('evt1762536035911efnviuzbl', 'joy4567'),
('evt1762536035911tmco23h23', 'joy4567'),
('evt1762552034302h1cr30akk', 'amalia8204'),
('evt1762552034302pyxrfug26', 'amalia8204'),
('evt1762552034302tmj4xl1tb', 'amalia8204'),
('evt17625521137952nsxsb1am', 'alex6130'),
('evt1762552113795daebk9mk7', 'alex6130'),
('evt1762552113795py31yvv4b', 'alex6130'),
('evt17625522431208ldrlflp5', 'teri8813'),
('evt1762552243122dbid5msqp', 'teri8813'),
('evt1762552243122soz7corsg', 'teri8813'),
('evt1762552314822cal5s1qyp', 'adelina2511'),
('evt1762552314822cal5s1qyp', 'ana2107'),
('evt1762552314822kn6u685xc', 'adelina2511'),
('evt1762552314822kn6u685xc', 'ana2107'),
('evt1762552314822x54r4nxgk', 'adelina2511'),
('evt1762552314822x54r4nxgk', 'ana2107'),
('evt1762552380813b29xaqnh6', 'zian2206'),
('evt1762552380813b3fz0v4bo', 'zian2206'),
('evt1762552380813qa5iinucj', 'zian2206'),
('evt17625524806284o21b426d', 'zian2206'),
('evt1762552480628l3jhc6c96', 'zian2206'),
('evt1762552480628suvt8vnpj', 'zian2206'),
('evt176255256736332mmzhthi', 'gabriela0307'),
('evt1762552567363cfo5yrzq3', 'gabriela0307'),
('evt1762552567363qe08pes0x', 'gabriela0307'),
('evt1762552567363rmjm1s2hk', 'gabriela0307'),
('evt1762552567363wapeyr3cx', 'gabriela0307'),
('evt1762552567363x384cpggl', 'gabriela0307'),
('evt1762552621020cu7ttqv3a', 'denis1298'),
('evt1762552621020kd7wr1muv', 'denis1298'),
('evt1762552621020ulvj99wyx', 'denis1298'),
('evt1762552695960h28b29b65', 'denis1298'),
('evt1762552695960nyskdoyxh', 'denis1298'),
('evt1762552695960sxm4vwfkv', 'denis1298'),
('evt176255275759500cxo4qh1', 'emilia1207'),
('evt1762552757595493uc0lqp', 'emilia1207'),
('evt1762552757595kr6l0osam', 'emilia1207'),
('evt1762552757595nkf4b68ft', 'emilia1207'),
('evt1762552757595s5uaa08vw', 'emilia1207'),
('evt1762552757595swqejjwf6', 'emilia1207'),
('evt176255281711407uz95pvv', 'emilia1207'),
('evt176255281711444w0lki5y', 'emilia1207'),
('evt1762552817114fgvhhu9wv', 'emilia1207'),
('evt1762552817114syugjuq68', 'emilia1207'),
('evt1762552817114wq7t82i1f', 'emilia1207'),
('evt1762552817114zrlgbolec', 'emilia1207'),
('evt17625528712386trg20m7e', 'emilia1207'),
('evt1762552871238gvw7bh8ae', 'emilia1207'),
('evt1762552871238hedzulval', 'emilia1207'),
('evt1762552939801gaf7kiqq4', 'victor0405'),
('evt1762552939801k4jywyyho', 'victor0405'),
('evt1762552939801xfd2bih20', 'victor0405'),
('evt1762606825669deolwph1r', 'client1111');

-- --------------------------------------------------------

--
-- Table structure for table `event_programs`
--

CREATE TABLE `event_programs` (
  `event_id` varchar(255) NOT NULL,
  `program_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `event_programs`
--

INSERT INTO `event_programs` (`event_id`, `program_id`) VALUES
('evt1762382677512feg1gl9ub', 'prog_1'),
('evt1762382677512feg1gl9ub', 'prog_11'),
('evt1762382677512feg1gl9ub', 'prog_12'),
('evt1762382677512feg1gl9ub', 'prog_13'),
('evt1762382677512feg1gl9ub', 'prog_3'),
('evt1762382677512feg1gl9ub', 'prog_4'),
('evt1762382677512feg1gl9ub', 'prog_6'),
('evt1762382677512feg1gl9ub', 'prog_7'),
('evt1762382677512feg1gl9ub', 'prog_8'),
('evt1762382677512ngtiq1mlo', 'prog_1'),
('evt1762382677512ngtiq1mlo', 'prog_11'),
('evt1762382677512ngtiq1mlo', 'prog_12'),
('evt1762382677512ngtiq1mlo', 'prog_13'),
('evt1762382677512ngtiq1mlo', 'prog_3'),
('evt1762382677512ngtiq1mlo', 'prog_4'),
('evt1762382677512ngtiq1mlo', 'prog_6'),
('evt1762382677512ngtiq1mlo', 'prog_7'),
('evt1762382677512ngtiq1mlo', 'prog_8'),
('evt1762382677512q5yiawj3w', 'prog_1'),
('evt1762382677512q5yiawj3w', 'prog_11'),
('evt1762382677512q5yiawj3w', 'prog_12'),
('evt1762382677512q5yiawj3w', 'prog_13'),
('evt1762382677512q5yiawj3w', 'prog_3'),
('evt1762382677512q5yiawj3w', 'prog_4'),
('evt1762382677512q5yiawj3w', 'prog_6'),
('evt1762382677512q5yiawj3w', 'prog_7'),
('evt1762382677512q5yiawj3w', 'prog_8'),
('evt1762382677512rkdb5ne8m', 'prog_1'),
('evt1762382677512rkdb5ne8m', 'prog_11'),
('evt1762382677512rkdb5ne8m', 'prog_12'),
('evt1762382677512rkdb5ne8m', 'prog_13'),
('evt1762382677512rkdb5ne8m', 'prog_3'),
('evt1762382677512rkdb5ne8m', 'prog_4'),
('evt1762382677512rkdb5ne8m', 'prog_6'),
('evt1762382677512rkdb5ne8m', 'prog_7'),
('evt1762382677512rkdb5ne8m', 'prog_8'),
('evt176241833315355ph8t7hf', 'prog_1'),
('evt176241833315355ph8t7hf', 'prog_11'),
('evt176241833315355ph8t7hf', 'prog_12'),
('evt176241833315355ph8t7hf', 'prog_13'),
('evt176241833315355ph8t7hf', 'prog_3'),
('evt176241833315355ph8t7hf', 'prog_4'),
('evt176241833315355ph8t7hf', 'prog_6'),
('evt176241833315355ph8t7hf', 'prog_7'),
('evt176241833315355ph8t7hf', 'prog_8'),
('evt1762418333153n6n72lxsh', 'prog_1'),
('evt1762418333153n6n72lxsh', 'prog_11'),
('evt1762418333153n6n72lxsh', 'prog_12'),
('evt1762418333153n6n72lxsh', 'prog_13'),
('evt1762418333153n6n72lxsh', 'prog_3'),
('evt1762418333153n6n72lxsh', 'prog_4'),
('evt1762418333153n6n72lxsh', 'prog_6'),
('evt1762418333153n6n72lxsh', 'prog_7'),
('evt1762418333153n6n72lxsh', 'prog_8'),
('evt1762418333153qsvffv8lv', 'prog_1'),
('evt1762418333153qsvffv8lv', 'prog_11'),
('evt1762418333153qsvffv8lv', 'prog_12'),
('evt1762418333153qsvffv8lv', 'prog_13'),
('evt1762418333153qsvffv8lv', 'prog_3'),
('evt1762418333153qsvffv8lv', 'prog_4'),
('evt1762418333153qsvffv8lv', 'prog_6'),
('evt1762418333153qsvffv8lv', 'prog_7'),
('evt1762418333153qsvffv8lv', 'prog_8'),
('evt1762418333153t1qrcx9xv', 'prog_1'),
('evt1762418333153t1qrcx9xv', 'prog_11'),
('evt1762418333153t1qrcx9xv', 'prog_12'),
('evt1762418333153t1qrcx9xv', 'prog_13'),
('evt1762418333153t1qrcx9xv', 'prog_3'),
('evt1762418333153t1qrcx9xv', 'prog_4'),
('evt1762418333153t1qrcx9xv', 'prog_6'),
('evt1762418333153t1qrcx9xv', 'prog_7'),
('evt1762418333153t1qrcx9xv', 'prog_8'),
('evt176241915273827902pehy', 'prog_1'),
('evt176241915273827902pehy', 'prog_11'),
('evt176241915273827902pehy', 'prog_12'),
('evt176241915273827902pehy', 'prog_13'),
('evt176241915273827902pehy', 'prog_3'),
('evt176241915273827902pehy', 'prog_4'),
('evt176241915273827902pehy', 'prog_6'),
('evt176241915273827902pehy', 'prog_7'),
('evt176241915273827902pehy', 'prog_8'),
('evt17624191527384dd0cgnk7', 'prog_1'),
('evt17624191527384dd0cgnk7', 'prog_11'),
('evt17624191527384dd0cgnk7', 'prog_12'),
('evt17624191527384dd0cgnk7', 'prog_13'),
('evt17624191527384dd0cgnk7', 'prog_3'),
('evt17624191527384dd0cgnk7', 'prog_4'),
('evt17624191527384dd0cgnk7', 'prog_6'),
('evt17624191527384dd0cgnk7', 'prog_7'),
('evt17624191527384dd0cgnk7', 'prog_8'),
('evt1762419152738kadiu5o3b', 'prog_1'),
('evt1762419152738kadiu5o3b', 'prog_11'),
('evt1762419152738kadiu5o3b', 'prog_12'),
('evt1762419152738kadiu5o3b', 'prog_13'),
('evt1762419152738kadiu5o3b', 'prog_3'),
('evt1762419152738kadiu5o3b', 'prog_4'),
('evt1762419152738kadiu5o3b', 'prog_6'),
('evt1762419152738kadiu5o3b', 'prog_7'),
('evt1762419152738kadiu5o3b', 'prog_8'),
('evt1762419152738p4syew1ch', 'prog_1'),
('evt1762419152738p4syew1ch', 'prog_11'),
('evt1762419152738p4syew1ch', 'prog_12'),
('evt1762419152738p4syew1ch', 'prog_13'),
('evt1762419152738p4syew1ch', 'prog_3'),
('evt1762419152738p4syew1ch', 'prog_4'),
('evt1762419152738p4syew1ch', 'prog_6'),
('evt1762419152738p4syew1ch', 'prog_7'),
('evt1762419152738p4syew1ch', 'prog_8'),
('evt1762535172546425ytwzjf', 'prog_1'),
('evt1762535172546425ytwzjf', 'prog_10'),
('evt1762535172546425ytwzjf', 'prog_11'),
('evt17625351725464ze75w8c0', 'prog_1'),
('evt17625351725464ze75w8c0', 'prog_10'),
('evt17625351725464ze75w8c0', 'prog_11'),
('evt17625351725466kek731vk', 'prog_1'),
('evt17625351725466kek731vk', 'prog_10'),
('evt17625351725466kek731vk', 'prog_11'),
('evt17625351725466mw9syydx', 'prog_1'),
('evt17625351725466mw9syydx', 'prog_10'),
('evt17625351725466mw9syydx', 'prog_11'),
('evt17625351725466rzmmrqa0', 'prog_1'),
('evt17625351725466rzmmrqa0', 'prog_10'),
('evt17625351725466rzmmrqa0', 'prog_11'),
('evt1762535172546ajiqp38z0', 'prog_1'),
('evt1762535172546ajiqp38z0', 'prog_10'),
('evt1762535172546ajiqp38z0', 'prog_11'),
('evt1762535172546atw689tpa', 'prog_1'),
('evt1762535172546atw689tpa', 'prog_10'),
('evt1762535172546atw689tpa', 'prog_11'),
('evt1762535172546bqqrh5rgh', 'prog_1'),
('evt1762535172546bqqrh5rgh', 'prog_10'),
('evt1762535172546bqqrh5rgh', 'prog_11'),
('evt1762535172546fux0cfity', 'prog_1'),
('evt1762535172546fux0cfity', 'prog_10'),
('evt1762535172546fux0cfity', 'prog_11'),
('evt1762535172546kcsdo5aig', 'prog_1'),
('evt1762535172546kcsdo5aig', 'prog_10'),
('evt1762535172546kcsdo5aig', 'prog_11'),
('evt1762535172546v6qn9lvur', 'prog_1'),
('evt1762535172546v6qn9lvur', 'prog_10'),
('evt1762535172546v6qn9lvur', 'prog_11'),
('evt1762535172546ytfx3vple', 'prog_1'),
('evt1762535172546ytfx3vple', 'prog_10'),
('evt1762535172546ytfx3vple', 'prog_11'),
('evt1762606825669deolwph1r', 'prog_10'),
('evt1762606825669deolwph1r', 'prog_11'),
('evt1762606825669deolwph1r', 'prog_12'),
('evt1762606825669deolwph1r', 'prog_13');

-- --------------------------------------------------------

--
-- Table structure for table `event_team_members`
--

CREATE TABLE `event_team_members` (
  `event_id` varchar(255) NOT NULL,
  `team_member_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `event_team_members`
--

INSERT INTO `event_team_members` (`event_id`, `team_member_id`) VALUES
('evt1762380491850bmgugzj9t', 'alexandra'),
('evt1762380491850d87sufkls', 'alexandra'),
('evt1762380491850pldo8kx3b', 'alexandra'),
('evt1762380491850rq96xong7', 'alexandra'),
('evt17623805185481h9gyx5s7', 'corina'),
('evt17623805185482akja668l', 'corina'),
('evt1762380518548gjenvajk3', 'corina'),
('evt1762380518548jhd4sojou', 'corina'),
('evt17623805431329n8qx0plo', 'dana'),
('evt1762380543132jwccciaix', 'dana'),
('evt1762380543132nelu3xquy', 'dana'),
('evt1762380543132yt8e6h1rx', 'dana'),
('evt17623805750226u9ug61ac', 'alexandra'),
('evt1762380575022jfudror5r', 'alexandra'),
('evt1762380575022wp2jgzl6s', 'alexandra'),
('evt1762380575022wtljub441', 'alexandra'),
('evt17623806008640iisg0bu5', 'alexandra'),
('evt17623806008640n4aa1xqm', 'alexandra'),
('evt17623806008643841th918', 'alexandra'),
('evt1762380600864ey5xr1rmq', 'alexandra'),
('evt1762380621146272vvcgnt', 'daniela'),
('evt17623806211468gkfbmzt7', 'daniela'),
('evt1762380621146lcewb4le9', 'daniela'),
('evt1762380621146z9pnr92u5', 'daniela'),
('evt1762380655077dvr4yu2oh', 'dana'),
('evt1762380655077hb39f2g0b', 'dana'),
('evt1762380655077x950vuxmu', 'dana'),
('evt1762380655077z8fmsipjg', 'dana'),
('evt17623806763150aast9717', 'alexandra'),
('evt17623806763154yiozi4zv', 'alexandra'),
('evt1762380676315wweh3mgtt', 'alexandra'),
('evt1762380676315x3fexxmnn', 'alexandra'),
('evt1762380705372899b8nxr3', 'corina'),
('evt1762380705372cowe9aqf5', 'corina'),
('evt1762380705372eezjq91xr', 'corina'),
('evt1762380705372rrzy92wgs', 'corina'),
('evt176238074082642p405z9w', 'alexandra'),
('evt1762380740826dcn37rewo', 'alexandra'),
('evt1762380740826md4cv4jod', 'alexandra'),
('evt1762380740826wph5fn9eo', 'alexandra'),
('evt17623810028071y8mv5c60', 'alexandra'),
('evt17623810028071y8mv5c60', 'corina'),
('evt17623810028071y8mv5c60', 'dana'),
('evt17623810028071y8mv5c60', 'daniela'),
('evt17623810028073pnv8vv3s', 'alexandra'),
('evt17623810028073pnv8vv3s', 'corina'),
('evt17623810028073pnv8vv3s', 'dana'),
('evt17623810028073pnv8vv3s', 'daniela'),
('evt176238100280765awvd6xv', 'alexandra'),
('evt176238100280765awvd6xv', 'corina'),
('evt176238100280765awvd6xv', 'dana'),
('evt176238100280765awvd6xv', 'daniela'),
('evt176238100280770teow4ma', 'alexandra'),
('evt176238100280770teow4ma', 'corina'),
('evt176238100280770teow4ma', 'dana'),
('evt176238100280770teow4ma', 'daniela'),
('evt17623810028078583x0puu', 'alexandra'),
('evt17623810028078583x0puu', 'corina'),
('evt17623810028078583x0puu', 'dana'),
('evt17623810028078583x0puu', 'daniela'),
('evt1762381002807gjmwstoyh', 'alexandra'),
('evt1762381002807gjmwstoyh', 'corina'),
('evt1762381002807gjmwstoyh', 'dana'),
('evt1762381002807gjmwstoyh', 'daniela'),
('evt1762381002807htcmx5bvm', 'alexandra'),
('evt1762381002807htcmx5bvm', 'corina'),
('evt1762381002807htcmx5bvm', 'dana'),
('evt1762381002807htcmx5bvm', 'daniela'),
('evt1762381002807imdmz1yug', 'alexandra'),
('evt1762381002807imdmz1yug', 'corina'),
('evt1762381002807imdmz1yug', 'dana'),
('evt1762381002807imdmz1yug', 'daniela'),
('evt1762381002807s8g4gvexi', 'alexandra'),
('evt1762381002807s8g4gvexi', 'corina'),
('evt1762381002807s8g4gvexi', 'dana'),
('evt1762381002807s8g4gvexi', 'daniela'),
('evt1762381002807sxl4i1myw', 'alexandra'),
('evt1762381002807sxl4i1myw', 'corina'),
('evt1762381002807sxl4i1myw', 'dana'),
('evt1762381002807sxl4i1myw', 'daniela'),
('evt1762381002807thupnt89h', 'alexandra'),
('evt1762381002807thupnt89h', 'corina'),
('evt1762381002807thupnt89h', 'dana'),
('evt1762381002807thupnt89h', 'daniela'),
('evt1762381002807z9uoq6r1d', 'alexandra'),
('evt1762381002807z9uoq6r1d', 'corina'),
('evt1762381002807z9uoq6r1d', 'dana'),
('evt1762381002807z9uoq6r1d', 'daniela'),
('evt1762381057840e42xmtwf4', 'alexandra'),
('evt1762381057840e42xmtwf4', 'corina'),
('evt1762381057840e42xmtwf4', 'dana'),
('evt1762381057840e42xmtwf4', 'daniela'),
('evt1762381057840hlrz69bjx', 'alexandra'),
('evt1762381057840hlrz69bjx', 'corina'),
('evt1762381057840hlrz69bjx', 'dana'),
('evt1762381057840hlrz69bjx', 'daniela'),
('evt1762381057840i4n9ocq5k', 'corina'),
('evt1762381057840s8d3a5wg8', 'alexandra'),
('evt1762381057840s8d3a5wg8', 'corina'),
('evt1762381057840s8d3a5wg8', 'dana'),
('evt1762381057840s8d3a5wg8', 'daniela'),
('evt17623811036707um1pkd4b', 'alexandra'),
('evt17623811036707um1pkd4b', 'dana'),
('evt17623811036707um1pkd4b', 'daniela'),
('evt17623811036709gjhkkwoy', 'alexandra'),
('evt17623811036709gjhkkwoy', 'dana'),
('evt17623811036709gjhkkwoy', 'daniela'),
('evt1762381103670itlb8s87n', 'alexandra'),
('evt1762381103670itlb8s87n', 'dana'),
('evt1762381103670itlb8s87n', 'daniela'),
('evt1762381103671l7q0s877t', 'alexandra'),
('evt1762381103671l7q0s877t', 'dana'),
('evt1762381103671l7q0s877t', 'daniela'),
('evt17623818087718jgcw8x5t', 'daniela'),
('evt1762381808771cipev88d2', 'daniela'),
('evt1762381808771qqi1ptgzu', 'daniela'),
('evt1762381808771w8glig1er', 'daniela'),
('evt17623818337893bzsrvfs5', 'alexandra'),
('evt17623818337899nr8hak2t', 'alexandra'),
('evt1762381833789e1943jz0w', 'alexandra'),
('evt1762381833789p68tn52vn', 'alexandra'),
('evt1762382677512feg1gl9ub', 'corina'),
('evt1762382677512ngtiq1mlo', 'corina'),
('evt1762382677512q5yiawj3w', 'corina'),
('evt1762382677512rkdb5ne8m', 'corina'),
('evt1762383304637560kig1gy', 'corina'),
('evt1762383304637da5aa0ks6', 'corina'),
('evt1762383304637m8dt3t3zr', 'corina'),
('evt1762383304637p7mu4gqez', 'corina'),
('evt1762383363981imkwelpyh', 'corina'),
('evt1762383363981k8godazne', 'corina'),
('evt1762383363981lauk3bg1t', 'corina'),
('evt1762383363981t2v3uhzb7', 'corina'),
('evt17623834304854p8qj004w', 'daniela'),
('evt176238343048573umtj8sr', 'daniela'),
('evt17623834304858r4f0xbw9', 'daniela'),
('evt1762383430485o2q1urzvi', 'daniela'),
('evt17623835469826z0pjiawc', 'daniela'),
('evt1762383546982cft7ghryd', 'daniela'),
('evt1762383546982d7ynq46t3', 'daniela'),
('evt1762383546982oligwt11f', 'daniela'),
('evt1762383578786bpn1fdhyh', 'daniela'),
('evt1762383578786q879ksndx', 'daniela'),
('evt1762383578786wlnq0aaxg', 'daniela'),
('evt1762383578786yg63evw0j', 'daniela'),
('evt17623836367119eiun0sdn', 'alexandra'),
('evt1762383636711hp9mxduje', 'alexandra'),
('evt1762383636711pt6vfc63q', 'alexandra'),
('evt1762383636711uj81008zq', 'alexandra'),
('evt1762383662439finkw5pfw', 'alexandra'),
('evt1762383662439lskj20g85', 'alexandra'),
('evt1762383662439stglyuqzz', 'alexandra'),
('evt1762383662439u4u9f879d', 'alexandra'),
('evt17623841024433iy8cq1f9', 'dana'),
('evt17623841024436vs5ibk79', 'dana'),
('evt1762384102443p047kd4a9', 'dana'),
('evt1762384102443vd9pcx7v1', 'dana'),
('evt176241833315355ph8t7hf', 'corina'),
('evt1762418333153n6n72lxsh', 'corina'),
('evt1762418333153qsvffv8lv', 'corina'),
('evt1762418333153t1qrcx9xv', 'corina'),
('evt1762418352470d8gmkvui0', 'corina'),
('evt1762418352470eoo20r2v8', 'corina'),
('evt1762418352470ihcdqfl7w', 'corina'),
('evt1762418352470o1id4d403', 'corina'),
('evt1762418396242aycn46648', 'corina'),
('evt1762418396242ekog7m59x', 'corina'),
('evt1762418396242gufw95am2', 'corina'),
('evt1762418396242onzawmbnz', 'corina'),
('evt17624184346651adp6ip85', 'daniela'),
('evt1762418434665hirf7040d', 'daniela'),
('evt1762418434665iitl87l9y', 'daniela'),
('evt1762418434665ko9g38auk', 'daniela'),
('evt176241846416452mrh914s', 'daniela'),
('evt17624184641646cd6rexnw', 'daniela'),
('evt1762418464164nmxukhxg6', 'daniela'),
('evt1762418464164rpvzaram4', 'daniela'),
('evt17624190717978ug0n70if', 'daniela'),
('evt1762419071797fuxck92mx', 'daniela'),
('evt1762419071797lzt58r4rx', 'daniela'),
('evt1762419071797mx9fws0x9', 'daniela'),
('evt1762419092487bdtcbfake', 'daniela'),
('evt1762419092487ihm0kf48x', 'daniela'),
('evt1762419092487s142moehk', 'daniela'),
('evt1762419092487y3unbswk2', 'daniela'),
('evt176241911348212auoh4mq', 'daniela'),
('evt1762419113482km406v01v', 'daniela'),
('evt1762419113482pk38jp397', 'daniela'),
('evt1762419113482vw0c4mhd6', 'daniela'),
('evt176241915273827902pehy', 'alexandra'),
('evt17624191527384dd0cgnk7', 'alexandra'),
('evt1762419152738kadiu5o3b', 'alexandra'),
('evt1762419152738p4syew1ch', 'alexandra'),
('evt1762419178326abg2xl8s0', 'alexandra'),
('evt1762419178326ahmgg94vd', 'alexandra'),
('evt1762419178326bxghcp690', 'alexandra'),
('evt1762419178326lzdn2z4ex', 'alexandra'),
('evt17624192135988tc8uhbip', 'alexandra'),
('evt17624192135989afh1fpy1', 'alexandra'),
('evt1762419213598bdlxusjq2', 'alexandra'),
('evt1762419213598im90yd9sm', 'alexandra'),
('evt176242059479769vidxumu', 'dana'),
('evt17624205947979rb19zoiz', 'dana'),
('evt1762420594797cs40i3zzb', 'dana'),
('evt1762420594797t89ryc8u5', 'dana'),
('evt176242062069192l4lusms', 'dana'),
('evt1762420620691gng3t2a77', 'dana'),
('evt1762420620691piq9o08b0', 'dana'),
('evt1762420620691tydvja5vh', 'dana'),
('evt1762420645631275wk73wf', 'dana'),
('evt1762420645631ilo1rhl1s', 'dana'),
('evt1762420645631rdrenrbd3', 'dana'),
('evt1762420645631zzanobsqy', 'dana'),
('evt17624207373393kd6b6z8b', 'dana'),
('evt1762420737339ru6gjcsc8', 'dana'),
('evt1762420737339srts3zjv1', 'dana'),
('evt1762420737339tn86d8o18', 'dana'),
('evt17624207845063w81al3mc', 'corina'),
('evt17624207845069awsggd50', 'corina'),
('evt1762420784506eowbzx3rb', 'corina'),
('evt1762420784506tp28ejn7j', 'corina'),
('evt17624208154225iakq3prr', 'corina'),
('evt1762420815422l7u8xhtyb', 'corina'),
('evt1762420815422o9j3qqyta', 'corina'),
('evt1762420815422xpzfgz2d8', 'corina'),
('evt17624208338561tnuvxbqx', 'corina'),
('evt1762420833856kixmm9pfs', 'corina'),
('evt1762420833856vs26k1za2', 'corina'),
('evt1762420833856ytxht7zso', 'corina'),
('evt17624208565235cuyr3mso', 'corina'),
('evt1762420856523assoy5rh4', 'corina'),
('evt1762420856523onmvcrbmt', 'corina'),
('evt1762420856523qss8no34f', 'corina'),
('evt1762420885784a0r07zj1b', 'corina'),
('evt1762420885784ea5xqprex', 'corina'),
('evt1762420885784mfgjaxg3h', 'corina'),
('evt1762420885784mnthdl6hf', 'corina'),
('evt1762420909462fki85yd3q', 'daniela'),
('evt1762420909462orjvfx2m4', 'daniela'),
('evt1762420909462twx2eh5ac', 'daniela'),
('evt1762420909462y8yoj6ouv', 'daniela'),
('evt17624210301351zrgyokzz', 'daniela'),
('evt1762421030135a1kn1ilja', 'daniela'),
('evt1762421030135nc5pwkwnx', 'daniela'),
('evt1762421030135yx4zt25x1', 'daniela'),
('evt17624210526918dpibdlj3', 'daniela'),
('evt17624210526919gxdbo9tl', 'daniela'),
('evt1762421052691v6tkhex2p', 'daniela'),
('evt1762421052691yzwoduo8t', 'daniela'),
('evt1762421347600165td7k1w', 'alexandra'),
('evt17624213476003cuozkiym', 'alexandra'),
('evt1762421347600ahwyqq6i4', 'alexandra'),
('evt1762421347600yo0j76sb3', 'alexandra'),
('evt1762421442403otbu5223k', 'alexandra'),
('evt1762421442403r5y13ii29', 'alexandra'),
('evt1762421442403vgxwav3f8', 'alexandra'),
('evt1762421442403wb4ahanwo', 'alexandra'),
('evt176242146598659sjocvmp', 'dana'),
('evt17624214659867p5s18z2l', 'dana'),
('evt1762421465986bnd8t2ucc', 'dana'),
('evt1762421465986xfjzvbj6p', 'dana'),
('evt176242148786424olhm7j0', 'dana'),
('evt1762421487864caz0btrud', 'dana'),
('evt1762421487864d2qmz0oy3', 'dana'),
('evt1762421487864nl1rd6a4i', 'dana'),
('evt1762421509750eia2u28cc', 'dana'),
('evt1762421509750lrsxyhjvv', 'dana'),
('evt1762421509750n3p3dvbc3', 'dana'),
('evt1762421509750z2iaqu14d', 'dana'),
('evt17624215238011c5hz31gr', 'dana'),
('evt1762421523801dr7zcocfr', 'dana'),
('evt1762421523801j96hm7ffo', 'dana'),
('evt1762421523801lkchofv1t', 'dana'),
('evt176242237171934syxjqan', 'corina'),
('evt176242237171967g2jx5lk', 'corina'),
('evt1762422371719rys821vex', 'corina'),
('evt1762422371719w8wqzhsr7', 'corina'),
('evt17624223983388kol1sv9d', 'corina'),
('evt1762422398338fcpj9bt7j', 'corina'),
('evt1762422398338pfepfvete', 'corina'),
('evt1762422398338q8uy07dmw', 'corina'),
('evt17624224171422jo85kszw', 'corina'),
('evt176242241714232p6e0ks5', 'corina'),
('evt17624224171427itfsvbm8', 'corina'),
('evt1762422417142re90l7jks', 'corina'),
('evt1762422464134bvw2854aq', 'daniela'),
('evt1762422464134digoe3ioz', 'daniela'),
('evt1762422464134j8su8fgqw', 'daniela'),
('evt1762422464134vkc5lj18k', 'daniela'),
('evt17624224874681d0ygqkb9', 'daniela'),
('evt17624224874685hzy5mb1y', 'daniela'),
('evt1762422487468hnwp6uk4z', 'daniela'),
('evt1762422487468i3lh4o6f6', 'daniela'),
('evt17624225998055u7pkxwdj', 'alexandra'),
('evt1762422599805daty5gikc', 'alexandra'),
('evt1762422599805jls8ffvur', 'alexandra'),
('evt1762422599805xsm660n1o', 'alexandra'),
('evt17624228292864cli93zg4', 'alexandra'),
('evt1762422829286agtf1z7bg', 'alexandra'),
('evt1762422829286kwyj7jd1y', 'alexandra'),
('evt1762422829286mvgq438bf', 'alexandra'),
('evt1762422849000azlq7lkk9', 'alexandra'),
('evt1762422849000b2bxn4d60', 'alexandra'),
('evt1762422849000oqtceeu2b', 'alexandra'),
('evt1762422849000qddili9us', 'alexandra'),
('evt17624230937410orcy2shl', 'daniela'),
('evt17624230937419t1zmsql0', 'daniela'),
('evt1762423093741ili5p905l', 'daniela'),
('evt1762423093741l9xe4xxj1', 'daniela'),
('evt17624231199398tq6fsnl3', 'alexandra'),
('evt1762423119939cycuxaw40', 'alexandra'),
('evt1762423119939e8cfikjxb', 'alexandra'),
('evt1762423119939erk76gdtw', 'alexandra'),
('evt1762423139863d7c07obpz', 'alexandra'),
('evt1762423139863gllegvky8', 'alexandra'),
('evt1762423139863qxuwvs31p', 'alexandra'),
('evt1762423139863umeadko7o', 'alexandra'),
('evt17624231837212itl3nvmc', 'dana'),
('evt176242318372138z4cz1qk', 'dana'),
('evt1762423183721mx5neloxt', 'dana'),
('evt1762423183721y7uh7tfbi', 'dana'),
('evt1762423200502kg9hkkraz', 'dana'),
('evt1762423200502pmwbdjtdc', 'dana'),
('evt1762423200502wmh69lqvl', 'dana'),
('evt1762423200502yq999m70g', 'dana'),
('evt17624232302330orq9v7kt', 'dana'),
('evt176242323023352cld9zav', 'dana'),
('evt1762423230233boc8lkjjt', 'dana'),
('evt1762423230233ey5j2z216', 'dana'),
('evt176242326058294l4ikxr0', 'dana'),
('evt1762423260582k46ba0m3l', 'dana'),
('evt1762423260582kt1si0gl5', 'dana'),
('evt1762423260582qf6b1i4ib', 'dana'),
('evt1762535172546425ytwzjf', 'stefan'),
('evt17625351725464ze75w8c0', 'stefan'),
('evt17625351725466kek731vk', 'stefan'),
('evt17625351725466mw9syydx', 'stefan'),
('evt17625351725466rzmmrqa0', 'stefan'),
('evt1762535172546ajiqp38z0', 'stefan'),
('evt1762535172546atw689tpa', 'stefan'),
('evt1762535172546bqqrh5rgh', 'stefan'),
('evt1762535172546fux0cfity', 'stefan'),
('evt1762535172546kcsdo5aig', 'stefan'),
('evt1762535172546v6qn9lvur', 'stefan'),
('evt1762535172546ytfx3vple', 'stefan'),
('evt17625355690944zl3ilkb3', 'corina'),
('evt1762535658735feg191al2', 'corina'),
('evt17625360359116jk34etge', 'corina'),
('evt1762536035911a8wlgt9k6', 'corina'),
('evt1762536035911efnviuzbl', 'corina'),
('evt1762536035911tmco23h23', 'corina'),
('evt1762552034302h1cr30akk', 'corina'),
('evt1762552034302pyxrfug26', 'corina'),
('evt1762552034302tmj4xl1tb', 'corina'),
('evt17625521137952nsxsb1am', 'corina'),
('evt1762552113795daebk9mk7', 'corina'),
('evt1762552113795py31yvv4b', 'corina'),
('evt17625522431208ldrlflp5', 'corina'),
('evt1762552243122dbid5msqp', 'corina'),
('evt1762552243122soz7corsg', 'corina'),
('evt1762552314822cal5s1qyp', 'corina'),
('evt1762552314822kn6u685xc', 'corina'),
('evt1762552314822x54r4nxgk', 'corina'),
('evt1762552380813b29xaqnh6', 'daniela'),
('evt1762552380813b3fz0v4bo', 'daniela'),
('evt1762552380813qa5iinucj', 'daniela'),
('evt17625524806284o21b426d', 'dana'),
('evt1762552480628l3jhc6c96', 'dana'),
('evt1762552480628suvt8vnpj', 'dana'),
('evt176255256736332mmzhthi', 'dana'),
('evt1762552567363cfo5yrzq3', 'dana'),
('evt1762552567363qe08pes0x', 'dana'),
('evt1762552567363rmjm1s2hk', 'dana'),
('evt1762552567363wapeyr3cx', 'dana'),
('evt1762552567363x384cpggl', 'dana'),
('evt1762552621020cu7ttqv3a', 'daniela'),
('evt1762552621020kd7wr1muv', 'daniela'),
('evt1762552621020ulvj99wyx', 'daniela'),
('evt1762552695960h28b29b65', 'dana'),
('evt1762552695960nyskdoyxh', 'dana'),
('evt1762552695960sxm4vwfkv', 'dana'),
('evt176255275759500cxo4qh1', 'daniela'),
('evt1762552757595493uc0lqp', 'daniela'),
('evt1762552757595kr6l0osam', 'daniela'),
('evt1762552757595nkf4b68ft', 'daniela'),
('evt1762552757595s5uaa08vw', 'daniela'),
('evt1762552757595swqejjwf6', 'daniela'),
('evt176255281711407uz95pvv', 'daniela'),
('evt176255281711444w0lki5y', 'daniela'),
('evt1762552817114fgvhhu9wv', 'daniela'),
('evt1762552817114syugjuq68', 'daniela'),
('evt1762552817114wq7t82i1f', 'daniela'),
('evt1762552817114zrlgbolec', 'daniela'),
('evt17625528712386trg20m7e', 'daniela'),
('evt1762552871238gvw7bh8ae', 'daniela'),
('evt1762552871238hedzulval', 'daniela'),
('evt1762552939801gaf7kiqq4', 'daniela'),
('evt1762552939801k4jywyyho', 'daniela'),
('evt1762552939801xfd2bih20', 'daniela'),
('evt1762606825669deolwph1r', 'stefan');

-- --------------------------------------------------------

--
-- Table structure for table `event_types`
--

CREATE TABLE `event_types` (
  `id` varchar(50) NOT NULL,
  `label` varchar(100) NOT NULL,
  `isBillable` tinyint(1) DEFAULT 1 COMMENT 'Evenimentul este facturabil implicit',
  `base_price` decimal(10,2) NOT NULL DEFAULT 100.00,
  `requiresTime` tinyint(1) DEFAULT 1 COMMENT 'Evenimentul necesită oră și durată',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_types`
--

INSERT INTO `event_types` (`id`, `label`, `isBillable`, `base_price`, `requiresTime`, `created_at`, `updated_at`) VALUES
('coordination', 'Coordonare', 1, 50.00, 1, '2025-11-08 12:56:53', '2025-11-08 13:26:33'),
('day-off', 'Zi liberă', 0, 0.00, 0, '2025-11-08 12:56:53', '2025-11-08 13:26:33'),
('dezvoltare-personala', 'Dezvoltare personală', 1, 100.00, 1, '2025-11-08 12:56:53', '2025-11-08 12:56:53'),
('evaluare', 'Evaluare', 1, 100.00, 1, '2025-11-08 12:56:53', '2025-11-08 12:56:53'),
('group-therapy', 'Terapie de grup', 1, 80.00, 1, '2025-11-08 12:56:53', '2025-11-08 13:26:33'),
('logopedie', 'Logopedie', 1, 100.00, 1, '2025-11-08 12:56:53', '2025-11-08 12:56:53'),
('pauza-masa', 'Pauză de masă', 0, 0.00, 0, '2025-11-08 12:56:53', '2025-11-08 13:26:33'),
('psihoterapie', 'Psihoterapie', 1, 100.00, 1, '2025-11-08 12:56:53', '2025-11-08 12:56:53'),
('sedinta', 'Ședință', 0, 0.00, 0, '2025-11-08 12:56:53', '2025-11-08 13:26:33'),
('therapy', 'Terapie', 1, 100.00, 1, '2025-11-08 12:56:53', '2025-11-08 12:56:53');

-- --------------------------------------------------------

--
-- Table structure for table `logopedic_evaluations`
--

CREATE TABLE `logopedic_evaluations` (
  `id` int(11) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `eval_date` date NOT NULL,
  `scores_json` text DEFAULT NULL,
  `comments` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `monthly_themes`
--

CREATE TABLE `monthly_themes` (
  `id` int(11) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `month_key` varchar(10) NOT NULL,
  `theme_text` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `monthly_themes`
--

INSERT INTO `monthly_themes` (`id`, `client_id`, `month_key`, `theme_text`) VALUES
(225, 'client1111', '2025-11', 'test'),
(226, 'cezar1802', '2025-11', 'test 2');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` varchar(255) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `month_key` varchar(10) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `client_id`, `month_key`, `payment_date`, `amount`, `notes`) VALUES
('pay_1762417046602', 'cezar1802', '2025-11', '2025-11-06', 1000.00, '-1000 RON cadou de la Mos Craciun');

-- --------------------------------------------------------

--
-- Table structure for table `portage_evaluations`
--

CREATE TABLE `portage_evaluations` (
  `id` int(11) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `eval_date` date NOT NULL,
  `score` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `portage_evaluations`
--

INSERT INTO `portage_evaluations` (`id`, `client_id`, `domain`, `eval_date`, `score`) VALUES
(3376, 'client1111', 'Portrige - Limbaj', '2025-11-07', 12),
(3377, 'client1111', 'Portrige - Limbaj', '2025-12-08', 24),
(3378, 'client1111', 'Portrige - Limbaj', '2026-01-05', 36),
(3379, 'client1111', 'Portrige - Socializare', '2025-11-07', 12),
(3380, 'client1111', 'Portrige - Socializare', '2025-12-08', 24),
(3381, 'client1111', 'Portrige - Socializare', '2026-01-05', 36),
(3382, 'client1111', 'Portrige - Autoservire', '2025-11-07', 12),
(3383, 'client1111', 'Portrige - Autoservire', '2025-12-08', 24),
(3384, 'client1111', 'Portrige - Autoservire', '2026-01-05', 36),
(3385, 'client1111', 'Portrige - Comportament cognitiv', '2025-11-07', 12),
(3386, 'client1111', 'Portrige - Comportament cognitiv', '2025-12-08', 12),
(3387, 'client1111', 'Portrige - Comportament cognitiv', '2026-01-05', 36),
(3388, 'client1111', 'Portrige - Comportament motor', '2025-11-07', 12),
(3389, 'client1111', 'Portrige - Comportament motor', '2025-12-08', 12),
(3390, 'client1111', 'Portrige - Comportament motor', '2026-01-05', 36);

-- --------------------------------------------------------

--
-- Table structure for table `programs`
--

CREATE TABLE `programs` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `programs`
--

INSERT INTO `programs` (`id`, `title`, `description`) VALUES
('prog_1', 'Imitare orala', 'Reproduce miscarile gurii si sunetele produse de terapeut (ex: suflat, deschis gura, pronuntat silabe).'),
('prog_10', 'Gesturi si limbaj functional', 'Copilul foloseste gesturi sau cuvinte pentru a cere, a refuza sau a comunica nevoi („vreau apa”, „gata”).'),
('prog_11', 'Imitare verbala', 'Repeta cuvinte sau propozitii dupa adult („spune mama”, „spune apa”).'),
('prog_12', 'Joc si miscare', 'Activitati care combina jocul cu exercitiile fizice pentru coordonare si socializare.'),
('prog_13', 'Atentie', 'Exercitii pentru a creste capacitatea de concentrare pe o sarcina sau pe interlocutor.'),
('prog_2', 'Stimulare de limbaj', 'Activitati pentru a creste dorinta si capacitatea copilului de a comunica verbal.'),
('prog_3', 'Instructiuni functionale', 'Urmeaza comenzi simple din viata de zi cu zi („adu mingea”, „pune cana pe masa”).'),
('prog_4', 'Imitare motorie cu si fara obiect', 'Copiaza actiuni ale adultului care implica obiecte (ex: bate toba, împinge o masinuta).'),
('prog_5', 'Receptiv obiecte', 'Copilul învata sa recunoasca si sa indice obiecte atunci când sunt denumite („arata scaunul”).'),
('prog_6', 'Motricitate', 'Exercitii pentru dezvoltarea miscarilor fine si grosiere (ex: apucare, sarituri, tras linii).'),
('prog_7', 'Raspuns la nume', 'Învata sa se întoarca sau sa raspunda cand îsi aude numele.'),
('prog_8', 'Asteapta', 'Învata sa astepte pe rând, si amâne o dorinta sau o actiune.'),
('prog_9', 'Joc social', 'Exercitii de interactiune si schimb reciproc în joc (ex: „da-mi mingea”, „hai sa construim împreuna”).');

-- --------------------------------------------------------

--
-- Table structure for table `program_history`
--

CREATE TABLE `program_history` (
  `id` int(11) NOT NULL,
  `client_id` varchar(255) NOT NULL,
  `event_id` varchar(255) DEFAULT NULL,
  `program_id` varchar(255) NOT NULL,
  `score` varchar(50) DEFAULT NULL,
  `eval_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `program_history`
--

INSERT INTO `program_history` (`id`, `client_id`, `event_id`, `program_id`, `score`, `eval_date`) VALUES
(2217, 'client1111', 'evt17625351725466mw9syydx', 'prog_1', 'P', '2025-11-05'),
(2218, 'client1111', 'evt17625351725466mw9syydx', 'prog_10', '+', '2025-11-05'),
(2219, 'client1111', 'evt17625351725466mw9syydx', 'prog_11', '+', '2025-11-05'),
(2220, 'client1111', 'evt17625351725466rzmmrqa0', 'prog_1', '- (5), P (3), + (1)', '2025-11-04'),
(2221, 'client1111', 'evt17625351725466rzmmrqa0', 'prog_10', '0 (2), - (2)', '2025-11-04'),
(2222, 'client1111', 'evt17625351725466rzmmrqa0', 'prog_11', 'P (1), + (1)', '2025-11-04'),
(2223, 'client1111', 'evt1762535172546425ytwzjf', 'prog_1', '0', '2025-11-03'),
(2224, 'client1111', 'evt1762535172546425ytwzjf', 'prog_10', '-', '2025-11-03'),
(2225, 'client1111', 'evt1762535172546425ytwzjf', 'prog_11', '0', '2025-11-03'),
(2226, 'client1111', 'evt1762606825669deolwph1r', 'prog_10', '0 (11)', '2025-11-08');

-- --------------------------------------------------------

--
-- Table structure for table `team_members`
--

CREATE TABLE `team_members` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(10) DEFAULT NULL,
  `initials` varchar(5) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `team_members`
--

INSERT INTO `team_members` (`id`, `name`, `color`, `initials`, `role`) VALUES
('alexandra', 'Alexandra', '#9B59B6', 'AC', 'therapist'),
('corina', 'Corina', '#357cff', 'CG', 'admin'),
('dana', 'Dana G', '#FF6B6B', 'DG', 'therapist'),
('daniela', 'Dana P', '#12C4D9', 'DP', 'therapist'),
('stefan', 'Stefan', '#BFBFBF', 'SD', 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `role` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `created_at`) VALUES
('alexandra', 'alexandra', '210487', 'therapist', '2025-11-06 11:45:15'),
('corina', 'corina', '$C0r1n4', 'admin', '2025-11-06 11:45:15'),
('dana', 'dana', '#D4n4G', 'therapist', '2025-11-06 11:45:15'),
('daniela', 'daniela', '@D4n4P', 'therapist', '2025-11-06 11:45:15'),
('stefan', 'stefan', '&St3f', 'admin', '2025-11-06 11:45:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_clients`
--
ALTER TABLE `event_clients`
  ADD PRIMARY KEY (`event_id`,`client_id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `event_programs`
--
ALTER TABLE `event_programs`
  ADD PRIMARY KEY (`event_id`,`program_id`),
  ADD KEY `program_id` (`program_id`);

--
-- Indexes for table `event_team_members`
--
ALTER TABLE `event_team_members`
  ADD PRIMARY KEY (`event_id`,`team_member_id`),
  ADD KEY `team_member_id` (`team_member_id`);

--
-- Indexes for table `event_types`
--
ALTER TABLE `event_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logopedic_evaluations`
--
ALTER TABLE `logopedic_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `monthly_themes`
--
ALTER TABLE `monthly_themes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `portage_evaluations`
--
ALTER TABLE `portage_evaluations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `programs`
--
ALTER TABLE `programs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `program_history`
--
ALTER TABLE `program_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `team_members`
--
ALTER TABLE `team_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `logopedic_evaluations`
--
ALTER TABLE `logopedic_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `monthly_themes`
--
ALTER TABLE `monthly_themes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=227;

--
-- AUTO_INCREMENT for table `portage_evaluations`
--
ALTER TABLE `portage_evaluations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3391;

--
-- AUTO_INCREMENT for table `program_history`
--
ALTER TABLE `program_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2227;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `event_clients`
--
ALTER TABLE `event_clients`
  ADD CONSTRAINT `event_clients_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_clients_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_programs`
--
ALTER TABLE `event_programs`
  ADD CONSTRAINT `event_programs_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_programs_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `event_team_members`
--
ALTER TABLE `event_team_members`
  ADD CONSTRAINT `event_team_members_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_team_members_ibfk_2` FOREIGN KEY (`team_member_id`) REFERENCES `team_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `logopedic_evaluations`
--
ALTER TABLE `logopedic_evaluations`
  ADD CONSTRAINT `logopedic_evaluations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `monthly_themes`
--
ALTER TABLE `monthly_themes`
  ADD CONSTRAINT `monthly_themes_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `portage_evaluations`
--
ALTER TABLE `portage_evaluations`
  ADD CONSTRAINT `portage_evaluations_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `program_history`
--
ALTER TABLE `program_history`
  ADD CONSTRAINT `program_history_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
