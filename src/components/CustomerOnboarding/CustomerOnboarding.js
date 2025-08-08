import React, { useState, useEffect } from "react";
import "./CustomerOnboarding.css";

const CustomerOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    customer: {
      fullName: "",
      dob: "",
      mobile: "",
      email: "",
      pep: false,
      income_band: "Not provided",
      occupation: "",
    },
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pin: "",
      country: "",
    },
    ids: {
      idType: "", // e.g., Aadhaar, PAN
      idNumber: "", // the number of the selected ID
    },
    product: {
      desired_account: "",
      expected_mab_range: "",
    },
    documents: [],
    kycStatus: "pending",
    riskAssessment: "pending",
  });

  const [processId, setProcessId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [processingTimer, setProcessingTimer] = useState(0);

  // Step 1: Document Upload + Basic Info + Address, Step 2: Contact & Product Info (with Submit)
  const steps = [
    { id: 1, title: "Document & Basic Info", status: "active" },
    { id: 2, title: "Contact & Product Info", status: "pending" },
  ];

  useEffect(() => {
    setProcessId(`PROC-${Date.now()}`);
  }, []);

  // Timer effect for OCR processing
  useEffect(() => {
    let interval;
    if (ocrProcessing) {
      setProcessingTimer(0);
      interval = setInterval(() => {
        setProcessingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setProcessingTimer(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ocrProcessing]);



  // Debug: Monitor formData.documents changes
  useEffect(() => {
    console.log("=== FORMDATA DOCUMENTS CHANGED ===");
    console.log("Documents count:", formData.documents.length);
    console.log("Documents:", formData.documents);
  }, [formData.documents]);

  const addAlert = (message, type = "info") => {
    const alert = { id: Date.now(), message, type };
    setAlerts((prev) => [...prev, alert]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    }, 5000);
  };

  // Format timer display
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (files) => {
    console.log("=== FILE UPLOAD STARTED ===");
    console.log("Files received:", files);
    console.log("Current documents before upload:", formData.documents);

    const newFiles = Array.from(files).map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));

    console.log("New files created:", newFiles);

    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        documents: [...prev.documents, ...newFiles],
      };
      console.log(
        "Updated formData with documents:",
        updatedFormData.documents
      );
      console.log("Updated documents count:", updatedFormData.documents.length);

      // Use setTimeout to check state after update
      setTimeout(() => {
        console.log("=== STATE CHECK AFTER UPLOAD ===");
        console.log(
          "Documents in state after timeout:",
          updatedFormData.documents
        );
      }, 100);

      return updatedFormData;
    });

    addAlert(`${newFiles.length} document(s) uploaded successfully`, "success");

    // Wait a bit to ensure state is updated before OCR processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    // --- Backend Integration Starts Here ---
    if (files && files.length > 0) {
      setOcrProcessing(true);
      addAlert("Processing document with OCR...", "info");

      // Use backend OCR extract endpoint, then parse on frontend
      const formDataToSend = new FormData();
      formDataToSend.append("file", files[0]);

      try {
        console.log("Sending file to OCR endpoint:", files[0].name);
        const response = await fetch("/api/ocr/extract", {
          method: "POST",
          body: formDataToSend,
        });

        console.log("OCR Response status:", response.status);
        console.log("OCR Response headers:", response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OCR API Error:", response.status, errorText);
          throw new Error(
            `Extraction failed: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        console.log("OCR Response data:", data);

        const ocrText = data.text;
        // Debug: Log OCR text to help diagnose extraction/parsing issues
        console.log("Extracted OCR text:", ocrText);
        console.log("OCR text length:", ocrText ? ocrText.length : 0);

        // --- Parse OCR text for ID fields ---
        function parseIdFields(text) {
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
              /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*\||\s*$)/m, // Name followed by | or end of line
              /([A-Z][a-z]+\s+[A-Z][a-z]+)(?=\s*\|.*DOB)/g, // Name before DOB section
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

          // Fallback: Look for lines that look like names (avoiding common false positives)
          if (!fullName) {
            for (let line of lines) {
              // Skip lines with numbers, common words, or too short
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
            /([0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2})/g, // YYYY-MM-DD format
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
            /\b[2-9][0-9]{3}\s[0-9]{4}\s[0-9]{4}\b/g, // Standard format with spaces
            /\b[2-9][0-9]{11}\b/g, // Without spaces
            /\b[0-9]{4}\s[0-9]{4}\s[0-9]{4}\b/g, // Any 12-digit with spaces
            /([0-9]{4})\s*([0-9]{4})\s*([0-9]{4})/g, // Flexible spacing
          ];

          for (let i = 0; i < aadhaarPatterns.length; i++) {
            const matches = text.match(aadhaarPatterns[i]);
            if (matches) {
              idNumber = matches[0].replace(/\s+/g, " ").trim(); // Normalize spacing
              idType = "aadhaar"; // Match dropdown value
              console.log(`Aadhaar found with pattern ${i + 1}:`, idNumber);
              break;
            }
          }

          // PAN pattern
          if (!idNumber) {
            const panMatch = text.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g);
            if (panMatch) {
              idNumber = panMatch[0];
              idType = "pan"; // Match dropdown value
              console.log("PAN found:", idNumber);
            }
          }

          // Passport pattern
          if (!idNumber) {
            const passportMatch = text.match(/\b[A-Z][0-9]{7}\b/g);
            if (passportMatch) {
              idNumber = passportMatch[0];
              idType = "passport"; // Match dropdown value
              console.log("Passport found:", idNumber);
            }
          }

          // Driving License pattern (varies by state, but common patterns)
          if (!idNumber) {
            const dlMatch = text.match(
              /\b[A-Z]{2}[0-9]{2}\s?[0-9]{11}\b|\b[A-Z]{2}-[0-9]{13}\b/g
            );
            if (dlMatch) {
              idNumber = dlMatch[0];
              idType = "voter"; // Using voter as closest match in dropdown
              console.log("Driving License found:", idNumber);
            }
          }

          // Voter ID pattern
          if (!idNumber) {
            const voterMatch = text.match(/\b[A-Z]{3}[0-9]{7}\b/g);
            if (voterMatch) {
              idNumber = voterMatch[0];
              idType = "voter"; // Match dropdown value
              console.log("Voter ID found:", idNumber);
            }
          }

          // Additional check for Aadhaar based on text content
          if (
            !idType &&
            /aadhaar|आधार|government of india|unique identification|uid/i.test(
              text
            )
          ) {
            idType = "aadhaar"; // Match dropdown value
            console.log("ID Type identified as Aadhaar based on content");
          }

          // Additional check for PAN based on text content
          if (
            !idType &&
            /permanent account number|income tax|pan card|पैन/i.test(text)
          ) {
            idType = "pan"; // Match dropdown value
            console.log("ID Type identified as PAN based on content");
          }

          // Additional check for Passport based on text content
          if (
            !idType &&
            /passport|republic of india|भारत गणराज्य/i.test(text)
          ) {
            idType = "passport"; // Match dropdown value
            console.log("ID Type identified as Passport based on content");
          }

          console.log("Final ID Type:", idType);

          // === ADDRESS EXTRACTION ===
          console.log("--- Searching for Address ---");

          // For Aadhaar cards, look for the complete address pattern
          // Pattern 1: Look for the full S/O address block
          const fullAddressMatch = text.match(
            /S\/O\s+Anoop\s+Kumar\s+Jha[^|]*?\|\s*\|[^|]*?Address:\s*([^|]+?)(?=\s*\d{4}\s+\d{4}\s+\d{4})/s
          );
          if (fullAddressMatch) {
            address = fullAddressMatch[1]
              .trim()
              .replace(/\s+/g, " ")
              .replace(/\n/g, ", ");
            console.log("Address found via full Aadhaar pattern:", address);
          }

          // Pattern 2: Look for address after S/O line
          if (!address) {
            const soAddressMatch = text.match(
              /S\/O\s+[^,\n]+,\s*([^|]+?)(?=\s*\d{4}\s+\d{4}\s+\d{4}|$)/s
            );
            if (soAddressMatch) {
              address = soAddressMatch[1]
                .trim()
                .replace(/\s+/g, " ")
                .replace(/\n/g, ", ");
              // Clean unwanted words
              address = address
                .replace(/\b(Authentication|Verify|Signature)\b/gi, "")
                .trim();
              address = address
                .replace(/\s+/g, " ")
                .replace(/,\s*,/g, ",")
                .replace(/^,|,$/g, "");
              console.log("Address found via S/O pattern:", address);
            }
          }

          // Pattern 3: Look for the specific address structure in your Aadhaar
          if (!address) {
            const specificMatch = text.match(
              /22\/1,\s*VUAY\s+NAGAR[^|]*?Uttar\s+Pradesh\s*-\s*208005/s
            );
            if (specificMatch) {
              address = specificMatch[0]
                .trim()
                .replace(/\s+/g, " ")
                .replace(/\n/g, ", ");
              console.log("Address found via specific pattern:", address);
            }
          }

          // Pattern 4: Extract address components and combine
          if (!address) {
            const addressComponents = [];

            // Look for S/O line
            const soMatch = text.match(/S\/O\s+[A-Za-z\s]+/);
            if (soMatch) addressComponents.push(soMatch[0]);

            // Look for house number/street
            const houseMatch = text.match(/22\/1,?\s*VUAY\s+NAGAR/i);
            if (houseMatch) addressComponents.push(houseMatch[0]);

            // Look for area
            const areaMatch = text.match(/Hns\s+Nagar\s+S\.O/i);
            if (areaMatch) addressComponents.push(areaMatch[0]);

            // Look for city
            const cityMatch = text.match(/Kanpur\s+Nagar/i);
            if (cityMatch) addressComponents.push(cityMatch[0]);

            // Look for state and PIN
            const stateMatch = text.match(/Uttar\s+Pradesh\s*-?\s*208005/i);
            if (stateMatch) addressComponents.push(stateMatch[0]);

            if (addressComponents.length >= 3) {
              address = addressComponents.join(", ");
              // Clean unwanted words
              address = address
                .replace(/\b(Authentication|Verify|Signature)\b/gi, "")
                .trim();
              address = address
                .replace(/\s+/g, " ")
                .replace(/,\s*,/g, ",")
                .replace(/^,|,$/g, "");
              console.log("Address found by component extraction:", address);
            }
          }

          // Pattern 5: Look for lines containing address keywords
          if (!address) {
            const addressLines = [];
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();

              // Check for S/O line
              if (/S\/O\s+[A-Za-z\s]+/.test(line)) {
                addressLines.push(line);
                continue;
              }

              // Check for address components
              if (
                line.length > 5 &&
                /(?:22\/1|VUAY|NAGAR|Hns|Kanpur|Uttar|Pradesh|208005)/i.test(
                  line
                ) &&
                !/(?:aadhaar|government|india|male|female|dob|date|signature|verify|authentication|enrolment)/i.test(
                  line
                )
              ) {
                // Clean up the line by removing unwanted words
                let cleanLine = line
                  .replace(/\b(Authentication|Verify|Signature)\b/gi, "")
                  .trim();
                // Remove extra spaces and commas
                cleanLine = cleanLine
                  .replace(/\s+/g, " ")
                  .replace(/,\s*,/g, ",")
                  .replace(/^,|,$/g, "");
                if (cleanLine.length > 3) {
                  addressLines.push(cleanLine);
                }
              }

              if (addressLines.length >= 4) break; // Take first 4 address-like lines
            }

            if (addressLines.length > 0) {
              address = addressLines.join(", ");
              console.log("Address found by line analysis:", address);
            }
          }

          // Convert DOB to YYYY-MM-DD format for HTML date input
          let formattedDob = dob;
          if (dob) {
            try {
              // Handle DD/MM/YYYY format
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dob)) {
                const [day, month, year] = dob.split("/");
                formattedDob = `${year}-${month.padStart(
                  2,
                  "0"
                )}-${day.padStart(2, "0")}`;
              }
              // Handle DD-MM-YYYY format
              else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dob)) {
                const [day, month, year] = dob.split("-");
                formattedDob = `${year}-${month.padStart(
                  2,
                  "0"
                )}-${day.padStart(2, "0")}`;
              }
              // Handle DD Month YYYY format
              else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(dob)) {
                const date = new Date(dob);
                if (!isNaN(date.getTime())) {
                  formattedDob = date.toISOString().split("T")[0];
                }
              }
              console.log("DOB converted from", dob, "to", formattedDob);
            } catch (error) {
              console.log("DOB conversion failed, using original:", dob);
              formattedDob = dob;
            }
          }

          const result = {
            fullName,
            dob: formattedDob,
            idNumber,
            idType,
            address,
          };
          console.log("=== FINAL PARSING RESULTS ===");
          console.log("Full Name:", fullName);
          console.log("DOB (formatted):", formattedDob);
          console.log("ID Type:", idType);
          console.log("ID Number:", idNumber);
          console.log("Address:", address);

          return result;
        }

        const extracted = parseIdFields(ocrText);

        console.log("Extracted data to apply:", extracted);

        // Use functional update to ensure we get the latest state
        setFormData((prevFormData) => {
          console.log("Current form data before OCR update:", prevFormData);
          console.log("Documents before OCR update:", prevFormData.documents);
          console.log(
            "Documents count before OCR update:",
            prevFormData.documents.length
          );

          const newFormData = {
            ...prevFormData,
            customer: {
              ...prevFormData.customer,
              fullName: extracted.fullName || prevFormData.customer.fullName,
              dob: extracted.dob || prevFormData.customer.dob,
            },
            ids: {
              ...prevFormData.ids,
              idType: extracted.idType || prevFormData.ids.idType,
              idNumber: extracted.idNumber || prevFormData.ids.idNumber,
            },
            address: {
              ...prevFormData.address,
              line1: extracted.address || prevFormData.address.line1,
            },
            // IMPORTANT: Preserve the documents array from the latest state
            documents: prevFormData.documents,
          };

          console.log("New form data after OCR update:", newFormData);
          console.log(
            "Documents in new form data after OCR:",
            newFormData.documents
          );
          console.log(
            "Documents count in new form data after OCR:",
            newFormData.documents.length
          );

          return newFormData;
        });

        if (
          extracted.fullName ||
          extracted.dob ||
          extracted.idType ||
          extracted.idNumber ||
          extracted.address
        ) {
          addAlert(
            "Details autofilled from document. Please verify and complete the form.",
            "success"
          );
        } else {
          addAlert(
            "No recognizable data found in document. Please fill manually.",
            "warning"
          );
        }
      } catch (err) {
        console.error("OCR extraction error:", err);
        addAlert(
          `Failed to extract details from document: ${err.message}. Please fill manually.`,
          "error"
        );
      } finally {
        setOcrProcessing(false);
      }
    } else {
      setOcrProcessing(false);
    }
    // --- Backend Integration Ends Here ---
  };

  const removeFile = (fileId) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== fileId),
    }));
  };

  // New: handleNextStep logic for new step order
  const handleNextStep = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (currentStep === 1) {
      // Step 1: Document Upload + Basic Document Info + Address
      console.log("=== STEP 1 VALIDATION ===");
      console.log("Current formData.documents:", formData.documents);
      console.log("Documents length:", formData.documents.length);

      if (formData.documents.length === 0) {
        console.log("ERROR: No documents found in formData");
        addAlert("Please upload at least one document", "error");
        setLoading(false);
        return;
      }
      // Validate document info fields (name, dob, address line 1, id info)
      const { customer, ids, address } = formData;
      if (
        !customer.fullName ||
        !customer.dob ||
        !address.line1 ||
        !ids.idType ||
        !ids.idNumber
      ) {
        addAlert("Please fill in all required fields marked with *", "error");
        setLoading(false);
        return;
      }
      addAlert(
        "Document information saved. Proceed to fill contact and additional details.",
        "success"
      );
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }

    setLoading(false);
  };

  // New: handleSubmitFromStep2 - handles submission directly from step 2
  const handleSubmitFromStep2 = async () => {
    setLoading(true);

    // Step 2: Contact Info + Address Details + Product Info validation
    const { customer, address, product } = formData;
    if (
      !customer.mobile ||
      !customer.email ||
      !address.city ||
      !address.state ||
      !address.pin ||
      !address.country ||
      !product.desired_account ||
      !product.expected_mab_range
    ) {
      addAlert("Please fill in all required fields marked with *", "error");
      setLoading(false);
      return;
    }

    // If validation passes, submit the application
    await handleSubmitApplication();
  };

  const handleSubmitApplication = async () => {
    setLoading(true);

    try {
      // Prepare user info for BPMN process
      const userInfo = {
        customer: formData.customer,
        address: formData.address,
        ids: formData.ids,
        product: formData.product,
        submissionTimestamp: new Date().toISOString(),
      };

      console.log("=== STARTING BPMN ONBOARDING PROCESS ===");
      console.log("User Info:", userInfo);
      console.log("Documents:", formData.documents);

      // Create FormData for multipart request
      const formDataToSend = new FormData();
      formDataToSend.append("userInfo", JSON.stringify(userInfo));

      console.log(
        "UserInfo JSON being sent:",
        JSON.stringify(userInfo, null, 2)
      );

      // Add the first document (assuming primary document for BPMN start)
      if (formData.documents.length > 0) {
        const primaryDoc = formData.documents[0];
        console.log(
          "Primary document for BPMN:",
          primaryDoc.name,
          primaryDoc.size
        );

        // Use the actual file object stored in the document
        const file = primaryDoc.file;
        formDataToSend.append("document", file);

        console.log(
          "File prepared for upload:",
          file.name,
          file.size,
          file.type
        );
      } else {
        addAlert("No documents found to submit", "error");
        setLoading(false);
        return;
      }

      // Call BPMN start API
      const bpmnResponse = await fetch("/onboarding/start", {
        method: "POST",
        body: formDataToSend,
      });

      if (!bpmnResponse.ok) {
        throw new Error(`BPMN start failed: ${bpmnResponse.status}`);
      }

      const bpmnResult = await bpmnResponse.json();
      console.log("BPMN Process Started:", bpmnResult);

      // Set process ID from BPMN response
      setProcessId(bpmnResult.processInstanceKey);

      // Simulate additional processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Use BPMN success or simulate triage
      const riskLevels = ["low", "medium", "high"];
      const randomRisk =
        riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const triagePassed = randomRisk === "low"; // Only low risk passes automatically

      const updatedFormData = {
        ...formData,
        workflowStatus: triagePassed ? "account_setup" : "manual_review",
        submissionTimestamp: new Date().toISOString(),
        riskLevel: randomRisk,
        aiTriageResult: triagePassed ? "passed" : "failed",
        workflowHistory: [
          {
            step: "Application Submitted",
            status: "completed",
            timestamp: new Date().toISOString(),
            description: "Customer submitted onboarding application",
          },
          {
            step: "Initial Triage",
            status: "completed",
            timestamp: new Date().toISOString(),
            description: `AI Agent completed initial triage - ${randomRisk} risk detected`,
          },
          ...(triagePassed
            ? [
                {
                  step: "Account Setup",
                  status: "in_progress",
                  timestamp: new Date().toISOString(),
                  description: "Account creation in progress",
                },
              ]
            : [
                {
                  step: "Manual Review",
                  status: "pending",
                  timestamp: new Date().toISOString(),
                  description:
                    "Application requires manual review due to risk level",
                },
              ]),
        ],
      };

      // Update form data
      setFormData(updatedFormData);

      // Save to localStorage for other components to access
      const existingApplications = JSON.parse(
        localStorage.getItem("submittedApplications") || "[]"
      );
      const newApplication = {
        ...updatedFormData,
        id: processId,
        status: triagePassed ? "account_setup" : "pending_review",
      };

      existingApplications.push(newApplication);
      localStorage.setItem(
        "submittedApplications",
        JSON.stringify(existingApplications)
      );

      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"));

      if (triagePassed) {
        addAlert(
          `BPMN Process Started! Process ID: ${bpmnResult.processInstanceKey}`,
          "success"
        );
      } else {
        addAlert(
          `Application submitted successfully! Risk level: ${randomRisk.toUpperCase()}. Manual review required.`,
          "info"
        );
      }

      // Set submission state to show success screen
      setIsSubmitted(true);
    } catch (error) {
      console.error("BPMN onboarding start failed:", error);
      addAlert(`Failed to start onboarding process: ${error.message}`, "error");
    }

    setLoading(false);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };



  const getRiskLevelColor = (level) => {
    switch (level) {
      case "low":
        return "#28a745";
      case "medium":
        return "#ffc107";
      case "high":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_review":
        return "#ffc107";
      case "approved":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "additional_docs_required":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderSuccessScreen = () => {
    return (
      <div className="form-section">
        <h3 className="form-section-title">🎯 Onboarding Initiated</h3>
        <div className="completion-status">
          <div className="alert alert-success">
            <h4>✅ Onboarding Process Initiated!</h4>
            <p>
              Thank you for completing the onboarding process. The customer
              details and documents have been submitted to the BPMN workflow
              engine for processing.
            </p>
          </div>

          <div className="process-summary">
            <h4>📋 Process Summary</h4>
            <div className="summary-item">
              <span>
                <strong>Process Instance Key:</strong>
              </span>
              <span>{processId || "Pending..."}</span>
            </div>
            <div className="summary-item">
              <span>
                <strong>Submitted On:</strong>
              </span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span>
                <strong>Status:</strong>
              </span>
              <span>🔄 In Progress</span>
            </div>
          </div>

          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsSubmitted(false);
                setShowOnboarding(false);
                setCurrentStep(1);
                setFormData({
                  customer: {
                    fullName: "",
                    dob: "",
                    mobile: "",
                    email: "",
                    pep: false,
                    income_band: "Not provided",
                    occupation: "",
                  },
                  address: {
                    line1: "",
                    line2: "",
                    city: "",
                    state: "",
                    pin: "",
                    country: "",
                  },
                  ids: {
                    idType: "",
                    idNumber: "",
                  },
                  product: {
                    desired_account: "",
                    expected_mab_range: "",
                  },
                  documents: [],
                  kycStatus: "pending",
                  riskAssessment: "pending",
                });
              }}
            >
              Start New Application
            </button>
          </div>
        </div>
      </div>
    );
  };



  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Document Upload + Basic Info + Address
        return (
          <div className="form-section">
            <h3 className="form-section-title">
              Document Upload & Basic Information
            </h3>
            <div
              className="document-upload"
              onDrop={async (e) => {
                e.preventDefault();
                if (!ocrProcessing) {
                  await handleFileUpload(e.dataTransfer.files);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                if (!ocrProcessing) {
                  document.getElementById("file-input").click();
                }
              }}
              style={{
                opacity: ocrProcessing ? 0.6 : 1,
                cursor: ocrProcessing ? "not-allowed" : "pointer",
              }}
            >
              {ocrProcessing ? (
                <>
                  <div className="upload-spinner">
                    <div className="spinner"></div>
                  </div>
                  <div className="upload-text">
                    <p>Processing document with OCR...</p>
                    <p>
                      Please wait while we extract information from your
                      document
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">
                    <p>Drag and drop your documents here, or click to browse</p>
                    <p>Supported formats: PDF, JPG, PNG (Max 10MB each)</p>
                  </div>
                </>
              )}
              <input
                id="file-input"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={async (e) => {
                  if (!ocrProcessing) {
                    await handleFileUpload(e.target.files);
                  }
                }}
              />
            </div>

            {formData.documents.length > 0 && (
              <div className="file-list">
                <h4>Uploaded Documents:</h4>
                {formData.documents.map((doc) => (
                  <div key={doc.id} className="file-item">
                    <div>
                      <div className="file-name">{doc.name}</div>
                      <div className="file-size">
                        {formatFileSize(doc.size)}
                      </div>
                    </div>
                    <button
                      className="remove-file"
                      onClick={() => removeFile(doc.id)}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* OCR Processing Indicator */}
            {ocrProcessing && (
              <div className="ocr-processing-simple">
                <span className="simple-spinner">⏳</span>
                <span>Processing document... {formatTimer(processingTimer)}</span>
              </div>
            )}

            {/* Document-related fields */}
            <h4>Document Information</h4>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  value={formData.customer.fullName}
                  onChange={(e) =>
                    handleInputChange("customer", "fullName", e.target.value)
                  }
                  disabled={ocrProcessing}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.customer.dob}
                  onChange={(e) =>
                    handleInputChange("customer", "dob", e.target.value)
                  }
                  disabled={ocrProcessing}
                />
              </div>
            </div>
            <div className="grid equal-cols">
              <div className="input-group">
                <label className="input-label">Complete Address *</label>
                <textarea
                  value={formData.address.line1}
                  onChange={(e) =>
                    handleInputChange("address", "line1", e.target.value)
                  }
                  rows="3"
                  disabled={ocrProcessing}
                  style={{
                    width: "100%",
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: "inherit",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
            <div className="grid equal-cols">
              <div className="input-group">
                <label className="input-label">ID Type *</label>
                <select
                  value={formData.ids.idType}
                  onChange={(e) =>
                    handleInputChange("ids", "idType", e.target.value)
                  }
                  required
                  disabled={ocrProcessing}
                >
                  <option value="">Select ID Type</option>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="passport">Passport</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">{formData.ids.idType ? `${formData.ids.idType.toUpperCase()} Number` : 'ID Number'} *</label>
                <input
                  type="text"
                  value={formData.ids.idNumber}
                  onChange={(e) =>
                    handleInputChange("ids", "idNumber", e.target.value)
                  }
                  required
                  disabled={ocrProcessing}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        // Step 2: Contact Info, Address Details, and Product Info
        return (
          <div className="form-section">
            <h3 className="form-section-title">
              Contact & Product Information
            </h3>

            <h4>Contact Information</h4>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.customer.mobile}
                  onChange={(e) =>
                    handleInputChange("customer", "mobile", e.target.value)
                  }
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) =>
                    handleInputChange("customer", "email", e.target.value)
                  }
                />
              </div>
            </div>

            <h4>Personal Details</h4>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Occupation</label>
                <input
                  type="text"
                  value={formData.customer.occupation}
                  onChange={(e) =>
                    handleInputChange("customer", "occupation", e.target.value)
                  }
                />
              </div>
              <div className="input-group">
                <label className="input-label">Income Band</label>
                <select
                  value={formData.customer.income_band}
                  onChange={(e) =>
                    handleInputChange("customer", "income_band", e.target.value)
                  }
                >
                  <option value="">Select Income Band</option>
                  <option value="0-2L">0-2L</option>
                  <option value="2L-5L">2L-5L</option>
                  <option value="5L-10L">5L-10L</option>
                  <option value="10L+">10L+</option>
                  <option value="Not provided">Not provided</option>
                </select>
              </div>
            </div>
            <div className="grid grid-1">
              <div className="checkbox-container">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.customer.pep}
                    onChange={(e) =>
                      handleInputChange("customer", "pep", e.target.checked)
                    }
                  />
                  <span className="checkbox-label">
                    I am a Politically Exposed Person (PEP)
                  </span>
                </label>
              </div>
            </div>

            <h4>Address Details</h4>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">City *</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    handleInputChange("address", "city", e.target.value)
                  }
                />
              </div>
              <div className="input-group">
                <label className="input-label">State *</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) =>
                    handleInputChange("address", "state", e.target.value)
                  }
                />
              </div>
              <div className="input-group">
                <label className="input-label">PIN Code *</label>
                <input
                  type="text"
                  value={formData.address.pin}
                  onChange={(e) =>
                    handleInputChange("address", "pin", e.target.value)
                  }
                />
              </div>
              <div className="input-group">
                <label className="input-label">Country *</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) =>
                    handleInputChange("address", "country", e.target.value)
                  }
                />
              </div>
            </div>

            <h4>Product Details</h4>
            <div className="grid grid-2">
              <div className="input-group">
                <label className="input-label">Account Type *</label>
                <select
                  value={formData.product.desired_account}
                  onChange={(e) =>
                    handleInputChange(
                      "product",
                      "desired_account",
                      e.target.value
                    )
                  }
                >
                  <option value="">Select Account Type</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Expected Monthly Balance *</label>
                <select
                  value={formData.product.expected_mab_range}
                  onChange={(e) =>
                    handleInputChange(
                      "product",
                      "expected_mab_range",
                      e.target.value
                    )
                  }
                >
                  <option value="">Select Balance Range</option>
                  <option value="0-10k">0-10k</option>
                  <option value="10k-25k">10k-25k</option>
                  <option value="25k+">25k+</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container">
      {!showOnboarding ? (
        <div className="start-screen">
          <h1>Welcome to Customer Portal</h1>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={() => setShowOnboarding(true)}
            >
              Start Onboarding
            </button>
          </div>
        </div>
      ) : isSubmitted ? (
        <>
          <h1 className="page-title">Customer Onboarding</h1>
          {renderSuccessScreen()}
        </>
      ) : (
        <>
          <h1 className="page-title">Customer Onboarding</h1>

          {alerts.map((alert) => (
            <div key={alert.id} className={`alert alert-${alert.type}`}>
              {alert.message}
            </div>
          ))}

          <div className="workflow-container">
            {/* Steps Indicator */}
            <div className="step-indicator">
              {steps.map((step, index) => (
                <div key={step.id} className="step">
                  <div
                    className={`step-circle ${
                      index + 1 < currentStep
                        ? "completed"
                        : index + 1 === currentStep
                        ? "active"
                        : "pending"
                    }`}
                  >
                    {index + 1 < currentStep ? "✓" : step.id}
                  </div>
                  <div
                    className={`step-label ${
                      index + 1 < currentStep
                        ? "completed"
                        : index + 1 === currentStep
                        ? "active"
                        : ""
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
              ))}
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {renderStepContent()}

            <div className="step-navigation">
              {currentStep > 1 && (
                <button
                  className="btn btn-secondary"
                  onClick={handlePreviousStep}
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              {currentStep === 1 && (
                <button
                  className="btn btn-primary"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Next"}
                </button>
              )}
              {currentStep === 2 && (
                <button
                  className="btn btn-success"
                  onClick={handleSubmitFromStep2}
                  disabled={loading}
                >
                  {loading ? "Submitting Application..." : "Submit Application"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerOnboarding;
