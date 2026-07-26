import { useState } from "react";


function AdicionarCabo(){

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [fibras, setFibras] = useState("");
  const [tubos, setTubos] = useState("");
  const [observacao, setObservacao] = useState("");


  function salvar(){

    alert("Cabo cadastrado!");

    setNome("");
    setTipo("");
    setFibras("");
    setTubos("");
    setObservacao("");

  }


  return (

    <div>

      <h1>🔌 Adicionar Cabo</h1>


      <div className="card">


        <input
          placeholder="Nome do cabo"
          value={nome}
          onChange={(e)=>setNome(e.target.value)}
        />


        <br/><br/>


        <input
          placeholder="Tipo (AS200, AS80, Convencional...)"
          value={tipo}
          onChange={(e)=>setTipo(e.target.value)}
        />


        <br/><br/>


        <input
          placeholder="Quantidade de fibras (ex: 12FO)"
          value={fibras}
          onChange={(e)=>setFibras(e.target.value)}
        />


        <br/><br/>


        <input
          placeholder="Quantidade de tubos"
          value={tubos}
          onChange={(e)=>setTubos(e.target.value)}
        />


        <br/><br/>


        <textarea
          placeholder="Observações do cabo"
          value={observacao}
          onChange={(e)=>setObservacao(e.target.value)}
        />


        <br/><br/>


        <button onClick={salvar}>
          Salvar Cabo
        </button>


      </div>


    </div>

  );

}


export default AdicionarCabo;