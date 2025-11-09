-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 05, 2025 at 12:31 AM
-- Server version: 10.6.23-MariaDB
-- PHP Version: 8.4.13

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
('adelina2511', 'Adelina Laura Maria Letu', '', '', '2019-11-25', ''),
('ana2107', 'Ana Maria Zamfir', '', '', '2019-07-21', 'Pantoten (5ml), Mentat (5ml)'),
('cezar', 'Cezar Casian Dinca', 'stefan.dinca07@gmail.com', '+40746060987', '2021-02-18', 'Fara alergii, fara medicatie'),
('client_1761413174328', 'Concediu ', '', '', '2021-02-18', ''),
('client_1761643341351', 'Amalia', '', '', '2021-02-18', ''),
('client_1761643349779', 'Alex', '', '', '2021-02-18', ''),
('client_1761643470508', 'Teri', '', '', '2021-02-18', ''),
('client_1761643514679', 'Adina', '', '', '2021-02-18', ''),
('client_1761643521001', 'Emi', '', '', '2021-02-18', ''),
('client_1761643543975', 'Eve', '', '', '2021-02-18', ''),
('client_1761643648237', 'Stefan Negru', '', '', '2021-02-18', ''),
('client_1761643659906', 'Fabi', '', '', '2021-02-18', ''),
('client_1761643707751', 'Rory', '', '', '2021-02-18', ''),
('client_1761643743149', 'Nichita', '', '', '2021-02-18', ''),
('client_1761643773421', 'Vic mic', '', '', '2021-02-18', ''),
('client_1761643787055', 'Selin', '', '', '2021-02-18', ''),
('client_1761643795589', 'Eliza', '', '', '2021-02-18', ''),
('client_1761644096816', 'Ingrid', '', '', '2021-02-18', ''),
('client_1761644109173', 'Mirela', '', '', '2021-02-18', ''),
('client_1761644114958', 'Denis', '', '', '2021-02-18', ''),
('client_1761644124475', 'Anina', '', '', '2021-02-18', ''),
('client_1761644173838', 'Clara', '', '', '2021-02-18', ''),
('client_1761644177687', 'Gemeni', '', '', '2021-02-18', ''),
('client_1761656436895', 'Irina', '', '', '2021-02-18', ''),
('client_1761656796051', 'Sedinta', '', '', '2021-02-18', ''),
('client_1761656877588', 'Ale', '', '', '2021-02-18', ''),
('copil_1503', 'Copil test 2', '', '', '1988-03-15', ''),
('david1006', 'David Marian Burticel', '', '', '2018-06-10', 'Rispolept, Depakin'),
('dominic0703', 'Dominic Georgescu', '', '', '2019-03-07', ''),
('eduard3108', 'Eduard Buja', '', '', '2020-08-31', 'vitamine / suplimente'),
('efremia1701', 'Efremia Niculescu', '', '', '2021-01-17', ''),
('eric1912', 'Eric Cristian Suditu', '', '', '2022-12-19', 'Focus, Isoprinosine, Omega 3, Vit C, Vit D3, Anxiodep'),
('evelina2211', 'Ioana Evelina Matache', '', '', '2018-11-22', ''),
('gabriela0703', 'Gabriela Maria Cristiana Cozma', '', '', '2021-03-07', ''),
('joy1802', 'Joy Elisabeth Copaci', '', '', '2020-04-18', ''),
('maher1009', 'Maher Kadour', '', '', '2020-09-10', 'Fara alergii. Flixotide (inhalator astm)'),
('maia2903', 'Maia Berghian', '', '', '2023-03-29', ''),
('maria1012', 'Maria Ecaterina Lucaci', '', '', '2021-12-10', ''),
('matei0405', 'Matei Alexandru Mocanu', '', '', '2023-05-04', ''),
('mathias1501', 'Mathias Staicu', '', '', '2020-01-15', 'Suplimente (ulei de peste, vigantol)'),
('medeea2109', 'Clara-Medeea Postolache', '', '', '2022-09-21', ''),
('nectaria0104', 'Nectaria Stefania Rusu', '', '', '2021-04-01', 'intoleranta la histamina'),
('pavel1510', 'Pavel Ilan Croitoru', '', '', '2021-10-15', ''),
('petru2012', 'Petru Eric Croitoru', '', '', '2019-12-20', ''),
('rami1009', 'Rami Kadour', '', '', '2020-09-10', ''),
('rares3005', 'Rares Alexandru Ghita', '', '', '2018-05-30', ''),
('test', 'Copil_test', '', '', '2021-02-21', ''),
('tom0309', 'Tom Andrei Potecaru', '', '', '2022-09-03', ''),
('toni1505', 'Antonie-Ioan (Toni) Dumitru', '', '', '2020-05-15', 'Rispolept'),
('tudor1504', 'Tudor Condruc', '', '', '2019-04-15', ''),
('valentin1611', 'Valentin Alexanru Rimbu', '', '', '2021-11-16', '?? Alergie la nuca de cocos!'),
('victor0504', 'Victor Ioan Brinzea', '', '', '2019-04-05', ''),
('zian2206', 'Zian Matei Vlad', '', '', '2021-06-22', '');

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

