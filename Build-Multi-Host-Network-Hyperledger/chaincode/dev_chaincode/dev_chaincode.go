package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"math"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SmartContract example simple Chaincode implementation
type SmartContract struct {
}

type PowerBalance struct {
	Adress      string  `json:"Adress"`
	Production  float64 `json:"Production"`
	Consumption float64 `json:"Consumption"`
}

func (t *SmartContract) Init(stub shim.ChaincodeStubInterface) pb.Response {

	InitLedger(stub)
	return shim.Success(nil)
}

func InitLedger(stub shim.ChaincodeStubInterface) {
	balance := []PowerBalance{
		PowerBalance{Adress: "10 rue de la paix", Production: 0, Consumption: 0},
		PowerBalance{Adress: "12 route des jeunes", Production: 0, Consumption: 0},
		PowerBalance{Adress: "115 route de Thonon", Production: 0, Consumption: 0},
	}

	i := 0
	for i < len(balance) {
		fmt.Println("i is ", i)
		powerBalanceAsBytes, _ := json.Marshal(balance[i])
		stub.PutState("House"+strconv.Itoa(i), powerBalanceAsBytes)
		fmt.Println("Added", balance[i])
		i = i + 1
	}
}

func (t *SmartContract) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Balance Invoke")
	function, args := stub.GetFunctionAndParameters()
	if function == "produce" {
		// update value of balance
		return t.produce(stub, args)
	} else if function == "consume" {
		// Create an entity
		return t.consume(stub, args)
	} else if function == "create" {
		// Create an entity
		return t.create(stub, args)
	} else if function == "query" {
		// Create an entity
		return t.query(stub, args)
	} else if function == "getHistory" {
		// Create an entity
		return t.getHistory(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"produce\" \"consume\" \"create\" \"query\" \"getHistory\" ")
}

// Create a power Balance
func (t *SmartContract) create(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	var powerBalance = PowerBalance{Adress: args[1], Production: 0, Consumption: 0}

	balanceAsBytes, _ := json.Marshal(powerBalance)
	stub.PutState(args[0], balanceAsBytes)

	return shim.Success(nil)
}

// Update value of balance
func (t *SmartContract) produce(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	var product float64
	product, err := strconv.ParseFloat(args[1], 64)
	product = math.Abs(product)
	if err != nil {
		return shim.Error("The second argument must be a number")
	}

	balanceAsBytes, _ := stub.GetState(args[0])
	balance := PowerBalance{}

	json.Unmarshal(balanceAsBytes, &balance)
	balance.Production += product

	balanceAsBytes, _ = json.Marshal(balance)
	stub.PutState(args[0], balanceAsBytes)

	return shim.Success(nil)
}

// Update value of balance
func (t *SmartContract) consume(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	var consumption float64
	consumption, err := strconv.ParseFloat(args[1], 64)
	consumption = math.Abs(consumption)
	if err != nil {
		return shim.Error("The second argument must be a number")
	}

	balanceAsBytes, _ := stub.GetState(args[0])
	balance := PowerBalance{}

	json.Unmarshal(balanceAsBytes, &balance)
	balance.Consumption += consumption

	balanceAsBytes, _ = json.Marshal(balance)
	stub.PutState(args[0], balanceAsBytes)

	return shim.Success(nil)
}

func (t *SmartContract) query(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var adress string // Entities
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting name of the person to query")
	}

	adress = args[0]

	// Get the state from the ledger
	balanceAsbytes, err := stub.GetState(adress)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + adress + "\"}"
		return shim.Error(jsonResp)
	}

	if balanceAsbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + adress + "\"}"
		return shim.Error(jsonResp)
	}

	balance := PowerBalance{}
	json.Unmarshal(balanceAsbytes, &balance)

	jsonResp := "{\"Name\":\"" + adress +
		"\",\"Production\":\"" + strconv.FormatFloat(balance.Production, 'g', 10, 64) +
		"\",\"Consumption\":\"" + strconv.FormatFloat(balance.Consumption, 'g', 10, 64) +
		"\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return shim.Success(balanceAsbytes)
}

// ============================================================================================================================
// Get history of asset
//
// Shows Off GetHistoryForKey() - reading complete history of a key/value
//
// Inputs - Array of strings
//  0
//  id
//  "m01490985296352SjAyM"
// ============================================================================================================================
func (t *SmartContract) getHistory(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	type AuditHistory struct {
		TxId      string       `json:"txId"`
		Value     PowerBalance `json:"value"`
		Timestamp time.Time    `json:"timestamp"`
	}
	var history []AuditHistory
	var balance PowerBalance

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	balanceID := args[0]
	fmt.Printf("- start getHistoryForBalance: %s\n", balanceID)

	// Get History
	resultsIterator, err := stub.GetHistoryForKey(balanceID)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	for resultsIterator.HasNext() {
		historyData, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		var tx AuditHistory
		tx.TxId = historyData.TxId                  //copy transaction id over
		json.Unmarshal(historyData.Value, &balance) //un stringify it aka JSON.parse()
		// if historyData.Value == nil {               //balance has been deleted
		// 	var emptyBalance PowerBalance
		// 	tx.Value = emptyBalance //copy nil Balance
		// } else {
		json.Unmarshal(historyData.Value, &balance) //un stringify it aka JSON.parse()
		tx.Value = balance                          //copy marble over
		tx.Timestamp = time.Unix(historyData.Timestamp.GetSeconds(), 0)
		// }
		history = append(history, tx) //add this tx to the list
	}

	for _, element := range history {
		fmt.Println(element)
	}
	//fmt.Printf("- getHistoryForBalance returning:\n%s", history)

	//change to array of bytes
	historyAsBytes, _ := json.Marshal(history) //convert to array of bytes
	return shim.Success(historyAsBytes)
}

func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
