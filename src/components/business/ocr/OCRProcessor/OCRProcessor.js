import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './OCRProcessor.css';

/**
 * OCR Processing component that handles document text extraction and parsing
 * @param {Object} props - Component props
 * @param {function} props.onTextExtracted - Callback when text is successfully extracted
 * @param {function} [props.onError] - Callback when OCR processing fails
 * @param {function} [props.onProcessingStart] - Callback when OCR processing starts
 * @param {function} [props.onProcessingEnd] - Callback when OCR processing ends
 * @param {boolean} [props.autoProcess=true] - Whether to automatically process uploaded files
 */
const OCRProcessor = ({
  onTextExtracted,
  onError,
  onProcessingStart,
  onProcessingEnd,
  autoProcess = true
}) => {
  // Component state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTimer, setProcessingTimer] = useState(0);

  // OCR text parsing logic extracted from CustomerOnboarding
  // Parses various ID document types and extracts structured data
  const parseIdFields = (text) => {
    console.log("=== STARTING OCR TEXT PARSING ===");
    console.log("Raw OCR text:", text);
    console.log("Text length:", text.length);

    // Split text into lines for analysis
    const lines = text
      .split(/\n|\r/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    console.log(
      "Text lines:",
      lines.map((line, i) => `${i}: "${line}"`)
    );

    let fullName = null,
      dob = null,
      idNumber = null,
      address = null;

    // === FULL NAME EXTRACTION ===
    console.log("--- Searching for Full Name ---");

    // For Aadhaar cards, look for specific patterns
    const aadhaarNameMatch = text.match(
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*\|\s*\|[^|]*DOB:/
    );
    if (aadhaarNameMatch) {
      fullName = aadhaarNameMatch[1].trim();
      console.log("Name found via Aadhaar pattern:", fullName);
    }

    // If not found, try other patterns
    if (!fullName) {
      const namePatterns = [
        /(?:Name|नाम)[^:]*:?\s*([A-Z][A-Za-z .']+)/i,
        /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\||\s*$)/m,
        /([A-Z][a-z]+\s+[A-Z][a-z]+)(?=\s*\|.*DOB)/g,
      ];

      for (let i = 0; i < namePatterns.length; i++) {
        const match = text.match(namePatterns[i]);
        if (match && match[1]) {
          fullName = match[1].trim();
          console.log(`Name found with pattern ${i + 1}:`, fullName);
          break;
        }
      }
    }

    // Fallback: Look for lines that look like names
    if (!fullName) {
      for (let line of lines) {
        if (
          !/\d/.test(line) &&
          !/(?:government|india|aadhaar|card|male|female|address|dob|authority|identification|enrolment|information|verify|authentication)/i.test(
            line
          ) &&
          line.length > 5 &&
          line.length < 30 &&
          /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(line.trim())
        ) {
          fullName = line.trim();
          console.log("Name found by line analysis:", fullName);
          break;
        }
      }
    }

    // === DATE OF BIRTH EXTRACTION ===
    console.log("--- Searching for Date of Birth ---");

    const dobPatterns = [
      /(?:DOB|Date of Birth|जन्म तिथि)[^:]*:?\s*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i,
      /(?:DOB|Date of Birth|जन्म तिथि)[^:]*:?\s*([0-9]{1,2}\s[A-Za-z]{3,9}\s[0-9]{4})/i,
      /([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4})/g,
      /([0-9]{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s[0-9]{4})/gi,
      /([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2})/g,
    ];

    for (let i = 0; i < dobPatterns.length; i++) {
      const match = text.match(dobPatterns[i]);
      if (match && match[1]) {
        dob = match[1].trim();
        console.log(`DOB found with pattern ${i + 1}:`, dob);
        break;
      }
    }

    // === ID TYPE AND NUMBER EXTRACTION ===
    console.log("--- Searching for ID Type and Numbers ---");

    let idType = "";

    // Enhanced Aadhaar patterns
    const aadhaarPatterns = [
      /\b[2-9][0-9]{3}\s[0-9]{4}\s[0-9]{4}\b/g,
      /\b[2-9][0-9]{11}\b/g,
      /\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b/g,
      /([0-9]{4})\s*([0-9]{4})\s*([0-9]{4})/g,
    ];

    for (let i = 0; i < aadhaarPatterns.length; i++) {
      const matches = text.match(aadhaarPatterns[i]);
      if (matches) {
        idNumber = matches[0].replace(/\s+/g, " ").trim();
        idType = "aadhaar";
        console.log(`Aadhaar found with pattern ${i + 1}:`, idNumber);
        break;
      }
    }

    // PAN pattern
    if (!idNumber) {
      const panMatch = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g);
      if (panMatch) {
        idNumber = panMatch[0];
        idType = "pan";
        console.log("PAN found:", idNumber);
      }
    }

    // Passport pattern
    if (!idNumber) {
      const passportMatch = text.match(/\b[A-Z][0-9]{7}\b/g);
      if (passportMatch) {
        idNumber = passportMatch[0];
        idType = "passport";
        console.log("Passport found:", idNumber);
      }
    }

    // Driving License pattern
    if (!idNumber) {
      const dlMatch = text.match(
        /\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b|\b[A-Z]{2}-[0-9]{13}\b/g
      );
      if (dlMatch) {
        idNumber = dlMatch[0];
        idType = "voter";
        console.log("Driving License found:", idNumber);
      }
    }

    // Voter ID pattern
    if (!idNumber) {
      const voterMatch = text.match(/\b[A-Z]{3}[0-9]{7}\b/g);
      if (voterMatch) {
        idNumber = voterMatch[0];
        idType = "voter";
        console.log("Voter ID found:", idNumber);
      }
    }

    // Additional checks based on content
    if (
      !idType &&
      /aadhaar|आधार|government of india|unique identification|uid/i.test(text)
    ) {
      idType = "aadhaar";
      console.log("ID Type identified as Aadhaar based on content");
    }

    if (
      !idType &&
      /permanent account number|income tax|pan card|पैन/i.test(text)
    ) {
      idType = "pan";
      console.log("ID Type identified as PAN based on content");
    }

    if (
      !idType &&
      /passport|republic of india|भारत गणराज्य/i.test(text)
    ) {
      idType = "passport";
      console.log("ID Type identified as Passport based on content");
    }

    console.log("Final ID Type:", idType);

    // === ADDRESS EXTRACTION ===
    console.log("--- Searching for Address ---");

    // Pattern 1: Look for address after S/O line
    if (!address) {
      const soAddressMatch = text.match(
        /S\/O\s+[A-Za-z\s]+[,\s]+([^|]+?)(?=\s*\d{4}\s+\d{4}\s+\d{4}|$)/s
      );
      if (soAddressMatch) {
        address = soAddressMatch[1]
          .trim()
          .replace(/\s+/g, " ")
          .replace(/\n/g, ", ");
        address = address
          .replace(/\b(Authentication|Verify|Signature|Male|Female|DOB|Date of Birth)\b/gi, "")
          .trim();
        address = address
          .replace(/\s+/g, " ")
          .replace(/,\s*,/g, ",")
          .replace(/^,|,$/g, "");
        console.log("Address found via S/O pattern:", address);
      }
    }

    // Pattern 2: Look for address in structured format
    if (!address) {
      const addressPatterns = [
        /Address[^:]*:?\s*([^|]+?)(?=\s*\d{4}\s+\d{4}\s+\d{4}|$)/is,
        /पता[^:]*:?\s*([^|]+?)(?=\s*\d{4}\s+\d{4}\s+\d{4}|$)/is,
      ];

      for (let pattern of addressPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          address = match[1]
            .trim()
            .replace(/\s+/g, " ")
            .replace(/\n/g, ", ");
          console.log("Address found via pattern:", address);
          break;
        }
      }
    }

    const result = {
      fullName,
      dob,
      idType,
      idNumber,
      address,
      rawText: text
    };

    console.log("=== FINAL PARSING RESULT ===");
    console.log("Parsed data:", result);

    return result;
  };

  // Process uploaded file through OCR API
  const processFile = async (file) => {
    if (!file) return;

    // Set processing state
    setIsProcessing(true);
    setProcessingTimer(0);
    
    if (onProcessingStart) {
      onProcessingStart();
    }

    // Start processing timer for user feedback
    const timerInterval = setInterval(() => {
      setProcessingTimer(prev => prev + 1);
    }, 1000);

    try {
      console.log("Sending file to OCR endpoint:", file.name);
      
      // Prepare form data for OCR API
      const formData = new FormData();
      formData.append("file", file);

      // Send file to OCR endpoint
      const response = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      console.log("OCR Response status:", response.status);

      // Check if request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OCR API Error:", response.status, errorText);
        throw new Error(`Extraction failed: ${response.status} - ${errorText}`);
      }

      // Parse response data
      const data = await response.json();
      console.log("OCR Response data:", data);

      const ocrText = data.text;
      console.log("Extracted OCR text:", ocrText);

      // Parse the extracted text into structured data
      const parsedData = parseIdFields(ocrText);
      
      // Notify parent component with parsed data
      if (onTextExtracted) {
        onTextExtracted(parsedData);
      }

    } catch (error) {
      console.error("OCR processing error:", error);
      // Notify parent component of error
      if (onError) {
        onError(error);
      }
    } finally {
      // Clean up processing state
      clearInterval(timerInterval);
      setIsProcessing(false);
      setProcessingTimer(0);
      
      if (onProcessingEnd) {
        onProcessingEnd();
      }
    }
  };

  // Format timer display (mm:ss)
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ocr-processor">
      {/* Processing indicator */}
      {isProcessing && (
        <div className="ocr-processing-indicator">
          <div className="ocr-spinner"></div>
          <span>Processing document... {formatTimer(processingTimer)}</span>
        </div>
      )}
      
      {/* File input (only if autoProcess is enabled) */}
      {autoProcess && (
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              processFile(file);
            }
          }}
          disabled={isProcessing}
          className="ocr-file-input"
        />
      )}
    </div>
  );
};

OCRProcessor.propTypes = {
  onTextExtracted: PropTypes.func.isRequired,
  onError: PropTypes.func,
  onProcessingStart: PropTypes.func,
  onProcessingEnd: PropTypes.func,
  autoProcess: PropTypes.bool
};

// Export the parsing function for standalone use
export { parseIdFields };

export default OCRProcessor;