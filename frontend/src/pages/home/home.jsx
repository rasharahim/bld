import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';

// Replace these with your actual image imports
import heroImage1 from '../../assets/hero1.jpg';
import heroImage2 from '../../assets/hero2.jpg';
import heroImage3 from '../../assets/hero3.jpg';

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [stats, setStats] = useState({ donors: 0, requests: 0, livesSaved: 0 });

  const heroImages = [heroImage1, heroImage2, heroImage3];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  useEffect(() => {
    // Image rotation every 5 seconds
    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    // Simulate loading stats
    const statsInterval = setInterval(() => {
      setStats(prev => ({
        donors: prev.donors < 125 ? prev.donors + 3 : 125,
        requests: prev.requests < 85 ? prev.requests + 3 : 85,
        livesSaved: prev.livesSaved < 320 ? prev.livesSaved + 5 : 320
      }));
    }, 20);

    return () => {
      clearInterval(imageInterval);
      clearInterval(statsInterval);
    };
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div 
          className="hero-background"
          style={{ backgroundImage: `url(${heroImages[currentImage]})` }}
        ></div>
        <div className="hero-overlay"></div>
        
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.h1 className="hero-title" variants={itemVariants}>
            Blood Donation Management System
          </motion.h1>
          <motion.p className="hero-subtitle" variants={itemVariants}>
            Connecting donors with those in need - saving lives one donation at a time
          </motion.p>
          
          <motion.div className="cta-buttons" variants={itemVariants}>
            <Link to="/login" className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i> Login
            </Link>
            <Link to="/register" className="btn btn-outline">
              <i className="fas fa-user-plus"></i> Register
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div 
          className="hero-stats"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="stat-item">
            <h3>{stats.donors.toLocaleString()}+</h3>
            <p>Donors</p>
          </div>
          <div className="stat-item">
            <h3>{stats.requests.toLocaleString()}+</h3>
            <p>Requests</p>
          </div>
          <div className="stat-item">
            <h3>{stats.livesSaved.toLocaleString()}+</h3>
            <p>Lives Saved</p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 className="section-title" variants={itemVariants}>
            Why Choose Our Platform
          </motion.h2>
          <motion.p className="section-subtitle" variants={itemVariants}>
            We're revolutionizing blood donation management with cutting-edge technology
          </motion.p>
          
          <div className="features-grid">
            <motion.div 
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure & Reliable</h3>
              <p>
                Military-grade encryption protects all donor and patient data with strict compliance to healthcare regulations.
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="feature-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Real-Time Matching</h3>
              <p>
                Our intelligent system instantly matches blood requests with available donors in your area.
              </p>
            </motion.div>

            <motion.div 
              className="feature-card"
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="feature-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Location Tracking</h3>
              <p>
                Find the nearest blood banks and donation centers with our interactive map system.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.h2 className="section-title" variants={itemVariants}>
            Stories That Inspire
          </motion.h2>
          
          <div className="testimonial-cards">
            <motion.div 
              className="testimonial-card"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="testimonial-quote">
                <i className="fas fa-quote-left"></i>
              </div>
              <p className="testimonial-text">
                "This platform helped me find a rare blood type for my daughter's surgery within hours. Forever grateful!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Johnson" />
                </div>
                <div className="author-info">
                  <h4>Sarah Johnson</h4>
                  <p>Mother & Recipient</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="testimonial-card"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="testimonial-quote">
                <i className="fas fa-quote-left"></i>
              </div>
              <p className="testimonial-text">
                "As a regular donor, I love how easy it is to schedule appointments and track my donations."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Chen" />
                </div>
                <div className="author-info">
                  <h4>Michael Chen</h4>
                  <p>Blood Donor</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2>Ready to Make a Difference?</h2>
          <p>Join our community of lifesavers today</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              <i className="fas fa-user-plus"></i> Become a Donor
            </Link>
            <Link to="/about" className="btn btn-outline">
              Learn More
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;