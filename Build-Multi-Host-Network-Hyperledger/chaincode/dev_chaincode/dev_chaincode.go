/*
Copyright IBM Corp. 2016 All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

		 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package main

//WARNING - this chaincode's ID is hard-coded in chaincode_example04 to illustrate one way of
//calling chaincode from a chaincode. If this example is modified, chaincode_example04.go has
//to be modified as well with the new ID of chaincode_example02.
//chaincode_example05 show's how chaincode ID can be passed in as a parameter instead of
//hard-coding.

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// SmartContract example simple Chaincode implementation
type SmartContract struct {
}

type PowerBalance struct {
	Adress string  `json:"Adress"`
	Amount float64 `json:"Amount"`
}

func (t *SmartContract) Init(stub shim.ChaincodeStubInterface) pb.Response {

	InitLedger(stub)
	return shim.Success(nil)
}

func InitLedger(stub shim.ChaincodeStubInterface) {
	balance := []PowerBalance{
		PowerBalance{Adress: "10 rue de la paix", Amount: 0},
		PowerBalance{Adress: "12 route des jeunes", Amount: 200},
		PowerBalance{Adress: "115 route de thonon", Amount: 0},
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
	if function == "maj" {
		// update value of balance
		return t.maj(stub, args)
	} else if function == "create" {
		// Create an entity
		return t.create(stub, args)
	} else if function == "query" {
		// Create an entity
		return t.query(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"maj\" \"create\" \"query\"")
}

// Create a power Balance
func (t *SmartContract) create(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	var powerBalance = PowerBalance{Adress: args[0], Amount: 0}

	balanceAsBytes, _ := json.Marshal(powerBalance)
	stub.PutState(args[0], balanceAsBytes)

	return shim.Success(nil)
}

// Update value of balance
func (t *SmartContract) maj(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	var amount float64
	amount, err := strconv.ParseFloat(args[1], 64)
	if err != nil {
		return shim.Error("The second argument must be a number")
	}

	balanceAsBytes, _ := stub.GetState(args[0])
	balance := PowerBalance{}

	json.Unmarshal(balanceAsBytes, &balance)
	balance.Amount += amount

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

	jsonResp := "{\"Name\":\"" + adress + "\",\"Amount\":\"" + strconv.FormatFloat(balance.Amount, 'g', 10, 64) + "\"}"
	fmt.Printf("Query Response:%s\n", jsonResp)
	return shim.Success(balanceAsbytes)
}

func main() {
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
